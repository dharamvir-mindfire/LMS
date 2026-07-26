using FluentResults;
using LmsApi.Controllers.Dtos.Lessons;

namespace LmsApi.Contracts.IServices;

public interface ILessonService
{
    Task<Result<object>> ListAsync(int? subjectId);
    Task<Result<object>> GetAsync(int id);
    Task<Result<object>> CreateAsync(LessonRequest request);
    Task<Result<object>> UpdateAsync(int id, LessonRequest request);
    Task<Result> DeleteAsync(int id);
}
