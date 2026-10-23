using backend.DTOs.Pagination;
using backend.Helper;
using backend.Interface;
using backend.Model.Database;
using Microsoft.EntityFrameworkCore;

namespace backend.Repository;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AppDbContext _context;

    public AuditLogRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(AuditLog auditLog)
    {
        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }

    public async Task<PagedResult<AuditLog>> GetPagedAsync(PaginationRequest request){
    
        int pageNumber = Math.Max(1, request.pageNumber);
        int pageSize = Math.Clamp(request.pageSize, 1, 100);

        var query = _context.AuditLogs
            .AsNoTracking()
            .Include(a => a.User)
            .OrderByDescending(a => a.Timestamp)
            .ThenByDescending(a => a.Id);

        int totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<AuditLog>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

}
