using backend.Model.Database;
using backend.DTOs.CustomerDTOs;
using Microsoft.EntityFrameworkCore;

namespace backend.Service;

public class CustomerService
{
    private readonly AppDbContext _context;

    public CustomerService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CustomerDto>> GetCustomersAsync()
    {
        return await _context.Customers
            .Where(u => !u.IsDeleted && u.IsActive)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                Phone = c.Phone,
                Address = c.Address,
                Created = c.CreatedAt
            }).ToListAsync();
    }

    public async Task<CustomerDto?> GetCustomersByIdAsync(int id)
    {
        return await _context.Customers
            .Where(u => u.Id == id && !u.IsDeleted && u.IsActive)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                Phone = c.Phone,
                Address = c.Address,
                Created = c.CreatedAt
            }).FirstOrDefaultAsync();
    }

    public async Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto dto, int UserId)
    {
        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var ExistingCustomer = await _context.Customers.FirstOrDefaultAsync(
                u => u.Email == dto.Email && !u.IsDeleted);

            if (ExistingCustomer != null)
            {
                return null;
            }
        }

        var customer = new Customer
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,

            CreatedAt = DateTime.UtcNow,
            CreatedBy = UserId,

            IsActive = true,
            IsDeleted = false
        };

        _context.Customers.Add(customer);

        await _context.SaveChangesAsync();

        return new CustomerDto
        {
            Id = customer.Id,
            Name = customer.Name,
            Email = customer.Email,
            Phone = customer.Phone,
            Address = customer.Address,
            IsActive = customer.IsActive,
            Created = customer.CreatedAt
        };
       
    }

    public async Task<CustomerDto> UpdateCustomerAsync(
        int id, UpdateCustomerDto dto, int UserId )
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(
            u => u.Id == id && !u.IsDeleted); 
    
        if(customer == null)
        {
            return null;
        }

        customer.Name = dto.Name;
        customer.Email = dto.Email;
        customer.Phone = dto.Phone;
        customer.Address = dto.Address;
        customer.IsActive = dto.IsActive;

        customer.UpdatedAt = DateTime.UtcNow;
        customer.UpdatedBy = UserId;

        await _context.SaveChangesAsync();

        return new CustomerDto
        {
            Id = customer.Id,
            Name = customer.Name,
            Email = customer.Email,
            Phone = customer.Phone,
            Address = customer.Address,
            IsActive = customer.IsActive
        };

    }

    public async Task<bool> DeleteCustomerAsync(int id, int userId)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

        if (customer == null)
        {
            return false;
        }

        customer.IsDeleted = true;
        customer.UpdatedAt = DateTime.UtcNow;
        customer.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        return true;
    }

}
