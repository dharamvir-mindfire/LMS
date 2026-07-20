using FluentResults;

namespace LmsApi.Contracts.IServices;

public interface IHomeService
{
    Task<Result<object>> GetStatsAsync(int userId);
}
