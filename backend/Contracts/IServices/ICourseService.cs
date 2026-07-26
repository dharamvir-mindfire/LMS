using FluentResults;
using LmsApi.Controllers.Dtos.Courses;

namespace LmsApi.Contracts.IServices;

public interface ICourseService
{
    Task<Result<object>> ListAsync();
    Task<Result<object>> GetAsync(int id);
    Task<Result<object>> CreateAsync(CourseRequest request);
    Task<Result<object>> UpdateAsync(int id, CourseRequest request);
    Task<Result> DeleteAsync(int id);
}
