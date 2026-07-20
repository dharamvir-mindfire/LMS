using FluentResults;
using LmsApi.Controllers.Dtos.Subjects;

namespace LmsApi.Contracts.IServices;

public interface ISubjectService
{
    Task<Result<object>> ListAsync(int? courseId);
    Task<Result<object>> GetAsync(int id);
    Task<Result<object>> CreateAsync(SubjectRequest request);
    Task<Result<object>> UpdateAsync(int id, SubjectRequest request);
    Task<Result> DeleteAsync(int id);
}
