using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LmsApi.Models;
using Microsoft.IdentityModel.Tokens;

namespace LmsApi.Services;

public interface ITokenService
{
    string GenerateToken(User user);
}

// Mirrors utils/GenerateToken.ts: payload is { id, role, name }, signed with
// the shared secret, expiring after Jwt:ExpiresInDays (default matches the
// Node API's JWT_EXPIRES_IN=7d).
public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var secret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is not configured");
        var expiresInDays = double.Parse(_configuration["Jwt:ExpiresInDays"] ?? "7");

        var claims = new[]
        {
            new Claim("id", user.Id.ToString()),
            new Claim("role", user.Role),
            new Claim("name", user.Name),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(expiresInDays),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
