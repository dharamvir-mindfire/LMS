using LmsApi.Contracts.Enums;
using LmsApi.Models;

namespace LmsApi.Contracts.IHandlers;

public interface IOTPHandler
{
    string IssueOtp(User user);
    OtpVerifyResult VerifyOtp(User user, string code);
}
