using System.Net.Mail;
using System.Security.Cryptography;
using FluentResults;
using LmsApi.Contracts.Enums;
using LmsApi.Contracts.IHandlers;
using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Auth;
using LmsApi.Data;
using LmsApi.Extensions;
using LmsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly ITokenHandler _tokenHandler;
    private readonly IOTPHandler _otpHandler;

    public AuthService(AppDbContext db, ITokenHandler tokenHandler, IOTPHandler otpHandler)
    {
        _db = db;
        _tokenHandler = tokenHandler;
        _otpHandler = otpHandler;
    }

    private static bool IsValidEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    public async Task<Result<object>> RegisterAsync(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "name is required"));
        if (!IsValidEmail(request.Email))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "a valid email is required"));
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 6)
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "password must be at least 6 characters"));

        var email = request.Email!.ToLowerInvariant();
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existing != null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status409Conflict, "Email already in use"));

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 10),
            Role = "user",
            HasPassword = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _tokenHandler.GenerateToken(user);
        return Result.Ok<object>(new AuthResponse { Token = token, User = UserDto.From(user) });
    }

    public async Task<Result<object>> LoginAsync(LoginRequest request)
    {
        if (!IsValidEmail(request.Email))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "a valid email is required"));
        if (string.IsNullOrEmpty(request.Password))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "password is required"));

        var email = request.Email!.ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            return Result.Fail<object>(new HttpError(StatusCodes.Status401Unauthorized, "Invalid credentials"));

        var token = _tokenHandler.GenerateToken(user);
        return Result.Ok<object>(new AuthResponse { Token = token, User = UserDto.From(user) });
    }

    public async Task<Result<object>> GetMeAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "User not found"));

        return Result.Ok<object>(new { user = MeDto.From(user) });
    }

    public async Task<Result<object>> SendOtpAsync(SendOtpRequest request)
    {
        if (!IsValidEmail(request.Email))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "a valid email is required"));

        var email = request.Email!.ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            var randomPassword = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
            user = new User
            {
                Name = email.Split('@')[0],
                Email = email,
                Password = BCrypt.Net.BCrypt.HashPassword(randomPassword, workFactor: 10),
                HasPassword = false,
                Role = "user",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            _db.Users.Add(user);
        }

        var otpCode = _otpHandler.IssueOtp(user);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        Console.WriteLine($"OTP for {user.Email}: {otpCode}");
        return Result.Ok<object>(new { message = "OTP sent" });
    }

    public async Task<Result<object>> VerifyOtpAsync(VerifyOtpRequest request)
    {
        if (!IsValidEmail(request.Email))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "a valid email is required"));
        if (string.IsNullOrWhiteSpace(request.Otp))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "otp is required"));

        var email = request.Email!.ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "Invalid or expired OTP"));

        var result = _otpHandler.VerifyOtp(user, request.Otp!);
        switch (result)
        {
            case OtpVerifyResult.NoOtpPending:
                return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "Invalid or expired OTP"));
            case OtpVerifyResult.TooManyAttempts:
                return Result.Fail<object>(new HttpError(StatusCodes.Status429TooManyRequests, "Too many attempts. Request a new OTP"));
            case OtpVerifyResult.Mismatch:
                await _db.SaveChangesAsync();
                return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "Invalid or expired OTP"));
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = _tokenHandler.GenerateToken(user);
        return Result.Ok<object>(new AuthResponse { Token = token, User = UserDto.From(user) });
    }

    public async Task<Result<object>> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "name is required"));

        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "User not found"));

        user.Name = request.Name.Trim();
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result.Ok<object>(new { user = UserDto.From(user) });
    }

    public async Task<Result<object>> UpdatePasswordAsync(int userId, UpdatePasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.NewPassword) || request.NewPassword.Length < 6)
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "password must be at least 6 characters"));

        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "User not found"));

        if (user.HasPassword)
        {
            if (string.IsNullOrEmpty(request.CurrentPassword))
                return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "Current password is required"));
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
                return Result.Fail<object>(new HttpError(StatusCodes.Status401Unauthorized, "Current password is incorrect"));
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 10);
        user.HasPassword = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result.Ok<object>(new { user = UserDto.From(user) });
    }
}
