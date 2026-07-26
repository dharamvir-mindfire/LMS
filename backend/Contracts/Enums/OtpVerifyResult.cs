namespace LmsApi.Contracts.Enums;

public enum OtpVerifyResult
{
    Success,
    NoOtpPending,
    TooManyAttempts,
    Mismatch,
}
