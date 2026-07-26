using FluentResults;
using LmsApi.Controllers.Dtos.Questions;

namespace LmsApi.Contracts.IServices;

public interface IQuestionService
{
    Task<Result<object>> ListAsync(int? subjectId, string? difficulty);
    Task<Result<object>> GetAsync(int id);
    Task<Result<object>> CreateAsync(QuestionRequest request);
    Task<Result<object>> UpdateAsync(int id, QuestionRequest request);
    Task<Result> DeleteAsync(int id);
    Task<Result<object>> AnswerAsync(int id, int userId, AnswerRequest request);
}
