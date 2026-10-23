using backend.DTOs.CustomerDTOs;
using backend.DTOs.Pagination;
using backend.Helper;
using backend.Interface;
using backend.Model.Database;
using System.Text.Json;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
//using backend.Repository;

namespace backend.Service;

public class CustomerService
{
    private readonly ICustomerRepository _repository;
    private readonly AuditLogService _auditLogService;
    private readonly CurrentUserService _currentUser;

    public CustomerService(ICustomerRepository repository, AuditLogService auditLogService,
        CurrentUserService currentUser)
    {
        _repository = repository;
        _auditLogService = auditLogService;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<CustomerDto>> GetCustomersAsync(
        PaginationRequest request)
    {
        var customers = await _repository.GetPagedAsync(request);
        return new PagedResult<CustomerDto>
        {
            Items = customers.Items
            .Where(c => !c.IsDeleted)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                Phone = c.Phone,
                Address = c.Address,
                IsActive = c.IsActive,
                Created = c.CreatedAt
            })
            .ToList(),

            TotalCount = customers.TotalCount,
            PageNumber = customers.PageNumber,
            PageSize = customers.PageSize
        };
    }

    public async Task<CustomerDto?> GetCustomersByIdAsync(int id)
    {
        var customer = await _repository.GetByIdAsync(id);

        if (customer == null || customer.IsDeleted || !customer.IsActive) 
        {
            return null;
        }

        return MapToDto(customer);

        //return await _context.Customers
        //    .Where(u => u.Id == id && !u.IsDeleted && u.IsActive)
        //    .Select(c => new CustomerDto
        //    {
        //        Id = c.Id,
        //        Name = c.Name,
        //        Email = c.Email,
        //        Phone = c.Phone,
        //        Address = c.Address,
        //        Created = c.CreatedAt
        //    }).FirstOrDefaultAsync();
    }

    public async Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto dto, int UserId)
    {

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var existingCustomer = await _repository.GetByEmailAsync(dto.Email);
                //_context.Customers.FirstOrDefaultAsync(u => u.Email == dto.Email && !u.IsDeleted);

            if (existingCustomer != null && !existingCustomer.IsDeleted)
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

        var createdCustomer = await _repository.CreateAsync(customer);

        var newValues = JsonSerializer.Serialize(new
        {
            customer.Name,
            customer.Email,
            customer.Phone,
            customer.Address,
            customer.IsActive
        });

        await _auditLogService.LogAsync(
            _currentUser.UserId,
            "Create",
            "Customer",
            customer.Id.ToString(),
            null,
            newValues );

        return MapToDto(createdCustomer);
       
    }

    public async Task<CustomerDto?> UpdateCustomerAsync(
        int id, UpdateCustomerDto dto, int UserId )
    {
        var customer = await _repository.GetByIdAsync(id); 
    
        if(customer == null || customer.IsDeleted)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var existingCustomer =
                await _repository.GetByEmailAsync(dto.Email);

            if (existingCustomer != null
                && !existingCustomer.IsDeleted
                && existingCustomer.Id != id)
            {
                return null;
            }
        }

        var oldValues = JsonSerializer.Serialize(new
        {
            customer.Name,
            customer.Email,
            customer.Phone,
            customer.Address,
            customer.IsActive
        });

        customer.Name = dto.Name;
        customer.Email = dto.Email;
        customer.Phone = dto.Phone;
        customer.Address = dto.Address;

        customer.UpdatedAt = DateTime.UtcNow;
        customer.UpdatedBy = UserId;

        var updated = await _repository.UpdateAsync(customer);

        if (!updated)
        {
            return null;
        }

        var newValues = JsonSerializer.Serialize(new
        {
            customer.Name,
            customer.Email,
            customer.Phone,
            customer.Address,
            customer.IsActive
        });

        await _auditLogService.LogAsync(
            _currentUser.UserId,
            "Update",
            "Customer",
            customer.Id.ToString(),
            oldValues,
            newValues );

        return MapToDto(customer);

    }

    public async Task<bool> DeleteCustomerAsync(int id, int userId)
    {
        var customer = await _repository.GetByIdAsync(id);

        if (customer == null || customer.IsDeleted)
        {
            return false;
        }

        var oldValues = JsonSerializer.Serialize(new
        {
            customer.Name,
            customer.Email,
            customer.Phone,
            customer.Address,
            customer.IsActive,
            //customer.IsDeleted,
        });

        customer.IsActive = false;
        customer.UpdatedAt = DateTime.UtcNow;
        customer.UpdatedBy = userId;

        //return await _repository.UpdateAsync(customer);
        var update = await _repository.UpdateAsync(customer);
        

        var newValues = JsonSerializer.Serialize(new
        {
            customer.Name,
            customer.Email,
            customer.Phone,
            customer.Address,
            customer.IsActive,
        });

        await _auditLogService.LogAsync(
            _currentUser.UserId,
            "Delete",
            "Customer",
            customer.Id.ToString(),
            oldValues,
            newValues);

        return update;
    }

    private static CustomerDto MapToDto(Customer customer)
    {
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

}
