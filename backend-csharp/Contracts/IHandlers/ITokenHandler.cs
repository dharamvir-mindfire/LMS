using LmsApi.Models;

namespace LmsApi.Contracts.IHandlers;

public interface ITokenHandler
{
    string GenerateToken(User user);
}
