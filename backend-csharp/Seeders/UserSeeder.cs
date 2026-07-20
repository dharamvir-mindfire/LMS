using LmsApi.Data;
using LmsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Seeders;

public static class UserSeeder
{
    private static async Task<User> UpsertUserAsync(AppDbContext db, string name, string email, string password, string role)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existing != null)
        {
            Console.WriteLine($"User already exists, skipping: {email}");
            return existing;
        }

        var user = new User
        {
            Name = name,
            Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 10),
            Role = role,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        Console.WriteLine($"Created user: {email} ({role})");
        return user;
    }

    public static async Task RunAsync(AppDbContext db)
    {
        await UpsertUserAsync(db, "Admin", "admin@admin.com", "Admin@123", "admin");
        await UpsertUserAsync(db, "Demo User", "user@example.com", "User@123", "user");

        Console.WriteLine("\nSeed data ready. Login with:");
        Console.WriteLine("  Admin: admin@admin.com / Admin@123");
        Console.WriteLine("  User:  user@example.com / User@123");
    }
}
