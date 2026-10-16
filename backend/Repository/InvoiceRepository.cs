using backend.DTOs.Pagination;
using backend.Helper;
using backend.Interface;
using backend.Model.Database;
using Microsoft.EntityFrameworkCore;

namespace backend.Repository;

public class InvoiceRepository : IInvoiceRepository
{
    private readonly AppDbContext _context;

    public InvoiceRepository(AppDbContext context)
    {
        _context = context;
    } 

    public async Task<PagedResult<Invoice>> GetPagedAsync(PaginationRequest request)
    {
        var query = _context.Invoices
            .AsNoTracking()
            .Where(i => i.IsActive && !i.IsDeleted)
            .Include(i => i.Customer)
            .Include(i => i.InvoiceItems.Where(
                item => item.IsActive && !item.IsDeleted))
            .Include(i => i.PaymentAllocations
                .Where(a => a.IsActive && !a.IsDeleted))
            .ThenInclude(a => a.Payment);
            //.OrderByDescending(i => i.InvoiceDate);

        var totalCount = await query.CountAsync();

        var pageNumber = Math.Max(1, request.pageNumber);
        var pageSize = Math.Clamp(request.pageSize, 1, 100);

        var invoices = await query
            .OrderByDescending(i => i.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Invoice>
        {
            Items = invoices,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    //public async Task<List<Invoice>> GetAllAsync()
    //{
    //    return await _context.Invoices
    //        .AsNoTracking()
    //        .Where(i => i.IsActive && !i.IsDeleted)
    //        .Include(i => i.Customer)
    //        .Include(i => i.InvoiceItems.Where(
    //            item => item.IsActive && !item.IsDeleted))
    //        .Include(i => i.PaymentAllocations
    //            .Where(a => a.IsActive && !a.IsDeleted))
    //        .ThenInclude(a => a.Payment)
    //        .OrderByDescending(i => i.InvoiceDate)
    //        .ToListAsync();
    //}

    public async Task<Invoice?> GetByIdAsync(int id)
    {
        return await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.InvoiceItems.Where(
                item => item.IsActive && !item.IsDeleted))
            .Include(i => i.PaymentAllocations)
            .Include(i => i.PaymentAllocations
                .Where(a => a.IsActive && !a.IsDeleted))
            .ThenInclude(a => a.Payment)
            .FirstOrDefaultAsync(i => 
            i.Id == id && i.IsActive && !i.IsDeleted);
    }

    public async Task<bool> CustomerExistAsync(int customerId)
    {
        return await _context.Customers.AnyAsync(c => 
        c.Id == customerId && c.IsActive && !c.IsDeleted);
    }

    public async Task AddAsync(Invoice invoice)
    {
        await _context.Invoices.AddAsync(invoice);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
