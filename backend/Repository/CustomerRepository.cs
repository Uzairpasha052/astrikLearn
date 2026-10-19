//using backend.Data;
using backend.DTOs.Pagination;
using backend.Helper;
using backend.Interface;
using backend.Model.Database;
using Microsoft.EntityFrameworkCore;

namespace backend.Repository;

public class CustomerRepository : ICustomerRepository
{
    private readonly AppDbContext _context;

    public CustomerRepository(AppDbContext context)
    {
        _context = context;
    }

    //public async Task<List<Customer>> GetAllAsync()
    //{
    //    return await _context.Customers.ToListAsync();
    //}

    public async Task<Customer?> GetByIdAsync(int id)
    {
        return await _context.Customers.FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<Customer?> GetByEmailAsync(string email)
    {
        return _context.Customers.FirstOrDefault(x => x.Email == email);
    }

    public async Task<Customer> CreateAsync(Customer customer)
    {
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        return customer;
    }

    public async Task<bool> UpdateAsync(Customer customer)
    {
        _context.Customers.Update(customer);
        return await _context.SaveChangesAsync() > 0;
    }


    public async Task<PagedResult<Customer>> GetPagedAsync(
        PaginationRequest request)
    {
        int pageNumber = Math.Max(1, request.pageNumber);
        int pageSize = Math.Clamp(request.pageSize, 1, 100);

        var query = _context.Customers
            .AsNoTracking()
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.Id);

        int totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Customer>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    //public async Task<bool> DeleteAsync(Customer customer)
    //{
    //    _context.Customers.Remove(customer);
    //    return await _context.SaveChangesAsync() > 0;
    //}
}

