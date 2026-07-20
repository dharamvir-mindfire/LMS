using FluentResults;
using LmsApi.Controllers.Dtos.Auth;

namespace LmsApi.Contracts.IServices;

public interface IAuthService
{
    Task<Result<object>> RegisterAsync(RegisterRequest request);
    Task<Result<object>> LoginAsync(LoginRequest request);
    Task<Result<object>> GetMeAsync(int userId);
    Task<Result<object>> SendOtpAsync(SendOtpRequest request);
    Task<Result<object>> VerifyOtpAsync(VerifyOtpRequest request);
    Task<Result<object>> UpdateProfileAsync(int userId, UpdateProfileRequest request);
    Task<Result<object>> UpdatePasswordAsync(int userId, UpdatePasswordRequest request);
}
