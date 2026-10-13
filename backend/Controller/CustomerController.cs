using backend.DTOs;
using backend.DTOs.CustomerDTOs;
using backend.DTOs.Pagination;
using backend.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controller;

//[Authorize(Roles = "Admin,Accountant,Sales")]
[Authorize]
[ApiController]
[Route("api/customer")]
public class CustomerController : ControllerBase
{
    private readonly CustomerService _service;

    public CustomerController(CustomerService customerService)
    {
        _service = customerService;
    }

    // GET: api/customer
    [HttpGet]
    public async Task<IActionResult> GetCustomers([FromQuery] PaginationRequest request)
    {
        var customers = await _service.GetCustomersAsync(request);

        return Ok(customers);
    }

    // GET: api/customer/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCustomer(int id)
    {
        var customer = await _service.GetCustomersByIdAsync(id);

        if (customer == null)
        {
            return NotFound(new
            {
                message = "Customer not found"
            });
        }

        return Ok(customer);
    }

    // POST: api/customer
    [Authorize(Roles = "Admin, Sales")]
    [HttpPost]
    public async Task<IActionResult> CreateCustomer(
        [FromBody] CreateCustomerDto dto)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user"
            });
        }

        var customer = await _service.CreateCustomerAsync(dto, userId.Value);

        if (customer == null)
        {
            return Conflict(new
            {
                message = "A customer with this email already exists"
            });
        }

        return Ok(new
        {
            message = "Customer created successfully",
            customer
        });
    }

    // PUT: api/customer/5
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomer(
        int id,
        [FromBody] UpdateCustomerDto dto)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user"
            });
        }

        var customer = await _service.UpdateCustomerAsync(
            id,
            dto,
            userId.Value);

        if (customer == null)
        {
            return NotFound(new
            {
                message = "Customer not found"
            });
        }

        return Ok(new
        {
            message = "Customer updated successfully",
            customer
        });
    }

    // DELETE: api/customer/5
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user"
            });
        }

        var deleted = await _service.DeleteCustomerAsync(
            id,
            userId.Value);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Customer not found"
            });
        }

        return Ok(new
        {
            message = "Customer deleted successfully"
        });
    }

    private int? GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (int.TryParse(userId, out var id))
        {
            return id;
        }

        return null;
    }
}
