using backend.DTOs;
using backend.DTOs.Pagination;
using backend.Helper;
using backend.Interface;
using backend.Model;
using Microsoft.AspNetCore.Http.HttpResults;

//using backend.Repository;
using System.Text.Json;

namespace backend.Service;

public class UserService
{
    private readonly IUserRepository _context;
    //private readonly ITokenService _tokenService;
    private readonly AuditLogService _auditLogService;
    private readonly CurrentUserService _currentUser;

    public UserService(IUserRepository context, //ITokenService tokenService,
        AuditLogService auditLogService, CurrentUserService currentUser)
    {
        _context = context;
        //_tokenService = tokenService;
        _auditLogService = auditLogService;
        _currentUser = currentUser;
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

    public async Task<UserDisplayDto?> UpdateAsync(int id, UpdateUserDto dto, int userId)
    {
        if (id == userId)
        {
            throw new InvalidOperationException(
                "You cannot update your own Account");
        }

        var user = await _context.GetByIdAsync(id);
        if (user == null) { return null; }

        bool roleExist = await _context.RoleExistsAsync(dto.RoleId);
        if (!roleExist)
        {
            throw new ArgumentException("The specified role does not exist.");
        }

        var existingUser = await _context.GetByEmailAsync(dto.Email);
        if(existingUser != null && existingUser.Id != id)
        {
            throw new InvalidOperationException(
                "This email is already being used by another user.");
        }

        var oldValues = JsonSerializer.Serialize(new
        {
            user.Name,
            user.Mail,
            user.RoleId
        });

        user.Name = dto.Name;
        user.Mail = dto.Email;
        user.RoleId = dto.RoleId;
        user.UpdatedAt = DateTime.UtcNow;

        bool updated = await _context.UpdateAsync(user);

        if (!updated)
        {
            throw new InvalidOperationException("User update failed");
        }

        var updatedUser = await _context.GetByIdAsync(id);
        if(updatedUser == null) { return null;}

        var newValues = JsonSerializer.Serialize(new
        {
            updatedUser.Name,
            updatedUser.Mail,
            updatedUser.RoleId,
        });

        await _auditLogService.LogAsync(
            _currentUser.UserId,
            "Update",
            "User",
            updatedUser.Id.ToString(),
            oldValues,
            newValues
        );

        return new UserDisplayDto
        {
            Id = updatedUser.Id,
            Name = updatedUser.Name,
            Email = updatedUser.Mail,
            Role = updatedUser.Role.Name,
            Date = updatedUser.CreatedAt
        };
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        if(id == userId)
        {
            throw new InvalidOperationException(
                "You cannot delete your own account.");
        }

        var user = await _context.GetByIdAsync(id);
        if(user == null) { return false; }

        var oldValues = JsonSerializer.Serialize(new
        {
            user.Name,
            user.Mail,
            user.RoleId
        });

        var result = await _context.DeleteAsync(user);

        await _auditLogService.LogAsync(
            _currentUser.UserId,
            "Delete",
            "User",
            user.Id.ToString(),
            oldValues,
            null
        );

        return result;
    }
}
