using backend.DTOs;
using backend.DTOs.Pagination;
using backend.Helper;
using backend.Interface;
using backend.Model;
using backend.Repository;

namespace backend.Service;

public class AuthService
{
    private readonly IUserRepository _context;
    private readonly ITokenService _tokenService;

    public AuthService(IUserRepository context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<UserDisplayDto?> RegisterAsync(RegisterDto dto)
    {
        var existingUser = await _context.GetByEmailAsync(dto.Email);
        //var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Mail == dto.Email);

        if (existingUser != null)
        {
            return null;
        }

        var user = new User
        {
            Name = dto.Name,
            Mail = dto.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            RoleId = dto.Role,
            CreatedAt = DateTime.UtcNow,
            //UpdatedAt = DateTime.UtcNow
        };

        var createdUser = await _context.CreateAsync(user);

        return new UserDisplayDto
        {
            Id = createdUser.Id,
            Name = createdUser.Name,
            Email = createdUser.Mail,
            Role = createdUser.Role.Name ?? string.Empty,
            Date = createdUser.CreatedAt
            //Token = _tokenService.GenerateToken(createdUser)
        };

        //_context.Users.Add(user);
        //await _context.SaveChangesAsync();

        //return user;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var existingUser = await _context.GetByEmailAsync(dto.Mail);
        //var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Mail == dto.Mail);

        if (existingUser == null)
        {
            return null;
        }

        var passwordValid = BCrypt.Net.BCrypt.Verify(
            dto.Password,
            existingUser.Password
        );

        if (!passwordValid)
        {
            return null;
        }

        return new AuthResponseDto
        {
            Id = existingUser.Id,
            Name = existingUser.Name,
            Mail = existingUser.Mail,
            Role = existingUser.Role.Name ?? string.Empty,
            Token = _tokenService.GenerateToken(existingUser)
        };
        //return existingUser;

    }

    public async Task<List<UserDisplayDto>> UserDisplayAsync()
    {

        var user = await _context.GetAllAsync();
        return user
            .Select(u => new UserDisplayDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Mail,
                Role = u.Role.Name ?? string.Empty,
                Date = u.CreatedAt 
            } ).ToList();
    }


    public async Task<PagedResult<UserDisplayDto>> UserDisplayAsync(
        PaginationRequest request)
    {
        var result = await _context.GetPageAsync(request);

        return new PagedResult<UserDisplayDto>
        {
            Items = result.Items.Select(u => new UserDisplayDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Mail,
                Role = u.Role.Name ?? string.Empty,
                Date = u.CreatedAt
            }).ToList(),

            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }

}
