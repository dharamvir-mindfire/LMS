namespace LmsApi.Controllers.Dtos.Home;

public class HomeStatsDto
{
    public int Courses { get; set; }
    public int Subjects { get; set; }
    public int Lessons { get; set; }
    public int Quizzes { get; set; }
    public int QuestionsAnswered { get; set; }
}
