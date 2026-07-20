using FluentResults;
using LmsApi.Controllers.Dtos.Quizzes;

namespace LmsApi.Contracts.IServices;

public interface IQuizService
{
    Task<Result<object>> ListAsync(int? subjectId);
    Task<Result<object>> GetAsync(int id);
    Task<Result<object>> CreateAsync(int userId, QuizRequest request);
    Task<Result<object>> UpdateAsync(int id, QuizRequest request);
    Task<Result> DeleteAsync(int id);
    Task<Result<object>> StartAsync(int id);
    Task<Result<object>> SubmitAsync(int id, int userId, SubmitQuizRequest request);
}
