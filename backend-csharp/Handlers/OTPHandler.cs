using LmsApi.Models;

namespace LmsApi.Handlers;

public enum OtpVerifyResult
{
    Success,
    NoOtpPending,
    TooManyAttempts,
    Mismatch,
}

public interface IOTPHandler
{
    string IssueOtp(User user);
    OtpVerifyResult VerifyOtp(User user, string code);
}

// Mirrors AuthController.ts's sendOtp/verifyOtp inline OTP logic.
public class OTPHandler : IOTPHandler
{
    private const int OtpExpiryMinutes = 10;
    private const int OtpMaxAttempts = 5;

    public string IssueOtp(User user)
    {
        var otpCode = Random.Shared.Next(100000, 1000000).ToString();
        user.OtpCode = otpCode;
        user.OtpExpiresAt = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes);
        user.OtpAttempts = 0;
        return otpCode;
    }

    public OtpVerifyResult VerifyOtp(User user, string code)
    {
        if (user.OtpCode == null || user.OtpExpiresAt == null)
            return OtpVerifyResult.NoOtpPending;

        if (user.OtpAttempts >= OtpMaxAttempts)
            return OtpVerifyResult.TooManyAttempts;

        if (user.OtpCode != code || user.OtpExpiresAt.Value < DateTime.UtcNow)
        {
            user.OtpAttempts += 1;
            return OtpVerifyResult.Mismatch;
        }

        user.OtpCode = null;
        user.OtpExpiresAt = null;
        user.OtpAttempts = 0;
        return OtpVerifyResult.Success;
    }
}
