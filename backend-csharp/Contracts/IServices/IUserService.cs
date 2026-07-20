using FluentResults;
using LmsApi.Controllers.Dtos.Users;

namespace LmsApi.Contracts.IServices;

public interface IUserService
{
    Task<Result<object>> ListAsync();
    Task<Result<object>> UpdateRoleAsync(int id, UpdateRoleRequest request);
    Task<Result> DeleteAsync(int id);
}
