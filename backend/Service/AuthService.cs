using backend.DTOs;
using backend.Model;
using Microsoft.EntityFrameworkCore;
//using BCrypt.Net;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;

namespace backend.Service;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<User?> RegisterAsync(RegisterDto dto)
    {
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Mail == dto.Email);

        if (existingUser != null)
        {
            return null;
        }

        var user = new User
        {
            Name = dto.Name,
            Mail = dto.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
                   
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
    }

    public async Task<User?> LoginAsync(LoginDto dto)
    {
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Mail == dto.Mail);

        if(existingUser == null)
        {
            return null;
        }

        bool passwordValid = BCrypt.Net.BCrypt.Verify(
            dto.Password,
            existingUser.Password
        );

        if (!passwordValid)
        {
            return null;
        }

        return existingUser;

    }

    public async Task<List<UserDisplayDto>> UserDisplayAsync()
    {
        return await _context.Users
            .Select(u => new UserDisplayDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Mail,
                Role = u.Role,
                Date = u.CreatedAt 
            } ).ToListAsync();
    }

   
    public string GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Mail),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"]!
            )
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
