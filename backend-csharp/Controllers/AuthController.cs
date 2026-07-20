using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Auth;
using LmsApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LmsApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request) =>
        this.ToActionResult(await _authService.RegisterAsync(request), StatusCodes.Status201Created);

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request) =>
        this.ToActionResult(await _authService.LoginAsync(request));

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me() => this.ToActionResult(await _authService.GetMeAsync(User.GetUserId()));

    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp(SendOtpRequest request) =>
        this.ToActionResult(await _authService.SendOtpAsync(request));

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp(VerifyOtpRequest request) =>
        this.ToActionResult(await _authService.VerifyOtpAsync(request));

    [Authorize]
    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request) =>
        this.ToActionResult(await _authService.UpdateProfileAsync(User.GetUserId(), request));

    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> UpdatePassword(UpdatePasswordRequest request) =>
        this.ToActionResult(await _authService.UpdatePasswordAsync(User.GetUserId(), request));
}
