
using backend.Data;
using backend.DTOs.Pagination;
using backend.Helper;
using backend.Interface;
using backend.Model.Database;
using Microsoft.EntityFrameworkCore;

namespace backend.Repository;

public class ReminderRepository : IReminderRepository
{
    private readonly AppDbContext _context;

    public ReminderRepository(AppDbContext context)
    {
        _context = context;
    }

    //public async Task<List<Reminder>> GetAllAsync()
    //{
    //    return await _context.Reminders
    //        .AsNoTracking()
    //        .Where(r => !r.IsDeleted)
    //        .Include(r => r.Invoice)
    //            .ThenInclude(i => i.Customer)
    //        .OrderBy(r => r.ReminderDate)
    //        .ThenBy(r => r.Id)
    //        .ToListAsync();
    //}
    public async Task<PagedResult<Reminder>> GetAllAsync(
        PaginationRequest request)
    {
        int pageNumber = Math.Max(1, request.pageNumber);
        int pageSize = Math.Clamp(request.pageSize, 1, 100);

        var query = _context.Reminders
            .AsNoTracking()
            .Where(r => !r.IsDeleted)
            .Include(r => r.Invoice)
                .ThenInclude(i => i.Customer)
            .OrderBy(c => c.Id)
            .ThenBy(r => r.Id);

        int totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Reminder>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

    }

    public async Task<Reminder?> GetByIdAsync(int id)
    {
        return await _context.Reminders
            .AsNoTracking()
            .Where(r => r.Id == id && !r.IsDeleted)
            .Include(r => r.Invoice)
                .ThenInclude(i => i.Customer)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> InvoiceExistsAsync(int invoiceId)
    {
        return await _context.Invoices
            .AnyAsync(i =>
                i.Id == invoiceId &&
                i.IsActive &&
                !i.IsDeleted);
    }

    public async Task CreateAsync(Reminder reminder)
    {
        await _context.Reminders.AddAsync(reminder);
    }

    public Task UpdateAsync(Reminder reminder)
    {
        _context.Reminders.Update(reminder);

        return Task.CompletedTask;
    }

    public async Task<Reminder?> GetTrackedByIdAsync(int id)
    {
        return await _context.Reminders
            .FirstOrDefaultAsync(r =>
                r.Id == id &&
                !r.IsDeleted);
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Reminders
            .AnyAsync(r => r.Id == id && !r.IsDeleted);
    }

    public async Task<bool> SaveChanges()
    {
        return await _context.SaveChangesAsync() > 0;
    }

}
