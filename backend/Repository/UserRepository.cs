using backend.Model;
using backend.Data;
using backend.Interface;
using Microsoft.EntityFrameworkCore;
using backend.Helper;
using backend.DTOs.Pagination;


namespace backend.Repository;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .Include(c => c.Role)
            .FirstOrDefaultAsync(u => u.Mail ==  email);
    }

    public async Task<List<User>> GetAllAsync()
    {
        return await _context.Users.AsNoTracking().Include(u => u.Role).ToListAsync();
    }

    public async Task<User> CreateAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        //return user;
        return await _context.Users
            .Include(u => u.Role)
            .FirstAsync(u => u.Id == user.Id);
    }

    public async Task<PagedResult<User>> GetPageAsync(PaginationRequest request)
    {
        int pageNumber = Math.Max(1, request.pageNumber);
        int pageSize = Math.Clamp(request.pageSize, 1, 100);

        var query = _context.Users.AsNoTracking().Include(u => u.Role).OrderBy(u => u.Id);

        int totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<User>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };


    }
}
