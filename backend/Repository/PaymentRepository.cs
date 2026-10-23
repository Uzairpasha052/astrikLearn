using backend.Data.Scaffolded;
using backend.DTOs.Pagination;
using backend.Helper;
using backend.Interface;
using backend.Model.Database;
using Microsoft.EntityFrameworkCore;

namespace backend.Repository;

public class PaymentRepository : IPaymentRepository
{
    private readonly AppDbContext _context;

    public PaymentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<Payment>> GetAllAsync(PaginationRequest request)
    {
        int pageNumber = Math.Max(1, request.pageNumber);
        int pageSize = Math.Clamp(request.pageSize, 1, 100);

        var query = _context.Payments
            .AsNoTracking()
            .Where(p => !p.IsDeleted)
            .Include(p => p.Customer)
            .Include(p => p.PaymentAllocations
                .Where(a => a.IsActive && !a.IsDeleted))
            .OrderByDescending(p => p.PaymentDate)
            .ThenByDescending(p => p.Id);

        int totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Payment>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
        //return await _context.Payments
        //    .AsNoTracking()
        //    .Where(p => p.IsActive && !p.IsDeleted)
        //    .Include(p => p.Customer)
        //    .Include(p => p.PaymentAllocations
        //        .Where(a => a.IsActive && !a.IsDeleted))
        //        .OrderByDescending(p => p.PaymentDate)
        //        .ToListAsync();
    }

    public async Task<Payment?> GetByIdAsync(int id)
    {
        return await _context.Payments
            .Include(p => p.Customer)
            .Include(p => p.PaymentAllocations
                .Where(a => a.IsActive && !a.IsDeleted))
                .ThenInclude(a => a.Invoice)
            .FirstOrDefaultAsync(p =>
                p.Id == id &&
                p.IsActive &&
                !p.IsDeleted);
    }

    public async Task<bool> CustomerExistsAsync(int customerId)
    {
        return await _context.Customers.AnyAsync(c =>
            c.Id == customerId &&
            c.IsActive &&
            !c.IsDeleted);
    }

    public async Task<Invoice?> GetInvoiceForAllocationAsync(
       int invoiceId)
    {
        return await _context.Invoices
            .Include(i => i.PaymentAllocations
                .Where(a => a.IsActive && !a.IsDeleted))
            .ThenInclude(a => a.Payment)
            .FirstOrDefaultAsync(i =>
                i.Id == invoiceId &&
                i.IsActive &&
                !i.IsDeleted);
    }

    public async Task AddAsync(Payment payment)
    {
        await _context.Payments.AddAsync(payment);
    }

    public async Task AddAllocationsAsync(
        IEnumerable<PaymentAllocation> allocations)
    {
        await _context.PaymentAllocations.AddRangeAsync(allocations);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

}