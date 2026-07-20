using System.Net.Mail;
using System.Security.Cryptography;
using LmsApi.Data;
using LmsApi.Dtos.Auth;
using LmsApi.Models;
using LmsApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const int OtpExpiryMinutes = 10;
    private const int OtpMaxAttempts = 5;

    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;

    public AuthController(AppDbContext db, ITokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
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

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "name is required" });
        if (!IsValidEmail(request.Email))
            return BadRequest(new { message = "a valid email is required" });
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 6)
            return BadRequest(new { message = "password must be at least 6 characters" });

        var email = request.Email!.ToLowerInvariant();
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existing != null)
            return Conflict(new { message = "Email already in use" });

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

        var token = _tokenService.GenerateToken(user);
        return StatusCode(StatusCodes.Status201Created, new AuthResponse { Token = token, User = UserDto.From(user) });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (!IsValidEmail(request.Email))
            return BadRequest(new { message = "a valid email is required" });
        if (string.IsNullOrEmpty(request.Password))
            return BadRequest(new { message = "password is required" });

        var email = request.Email!.ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            return Unauthorized(new { message = "Invalid credentials" });

        var token = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse { Token = token, User = UserDto.From(user) });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _db.Users.FindAsync(User.GetUserId());
        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(new { user = MeDto.From(user) });
    }

    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp(SendOtpRequest request)
    {
        if (!IsValidEmail(request.Email))
            return BadRequest(new { message = "a valid email is required" });

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

        var otpCode = Random.Shared.Next(100000, 1000000).ToString();
        user.OtpCode = otpCode;
        user.OtpExpiresAt = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes);
        user.OtpAttempts = 0;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        Console.WriteLine($"OTP for {user.Email}: {otpCode}");
        return Ok(new { message = "OTP sent" });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp(VerifyOtpRequest request)
    {
        if (!IsValidEmail(request.Email))
            return BadRequest(new { message = "a valid email is required" });
        if (string.IsNullOrWhiteSpace(request.Otp))
            return BadRequest(new { message = "otp is required" });

        var email = request.Email!.ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || user.OtpCode == null || user.OtpExpiresAt == null)
            return BadRequest(new { message = "Invalid or expired OTP" });

        if (user.OtpAttempts >= OtpMaxAttempts)
            return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "Too many attempts. Request a new OTP" });

        if (user.OtpCode != request.Otp || user.OtpExpiresAt.Value < DateTime.UtcNow)
        {
            user.OtpAttempts += 1;
            await _db.SaveChangesAsync();
            return BadRequest(new { message = "Invalid or expired OTP" });
        }

        user.OtpCode = null;
        user.OtpExpiresAt = null;
        user.OtpAttempts = 0;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse { Token = token, User = UserDto.From(user) });
    }

    [Authorize]
    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "name is required" });

        var user = await _db.Users.FindAsync(User.GetUserId());
        if (user == null)
            return NotFound(new { message = "User not found" });

        user.Name = request.Name.Trim();
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { user = UserDto.From(user) });
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> UpdatePassword(UpdatePasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "password must be at least 6 characters" });

        var user = await _db.Users.FindAsync(User.GetUserId());
        if (user == null)
            return NotFound(new { message = "User not found" });

        if (user.HasPassword)
        {
            if (string.IsNullOrEmpty(request.CurrentPassword))
                return BadRequest(new { message = "Current password is required" });
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
                return Unauthorized(new { message = "Current password is incorrect" });
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 10);
        user.HasPassword = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { user = UserDto.From(user) });
    }
}
