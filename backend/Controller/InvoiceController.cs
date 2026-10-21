using backend.DTOs.InvoiceDTOs;
using backend.DTOs.Pagination;
using backend.Model;
using backend.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controller;

[Authorize]
[ApiController]
[Route("api/invoice")]
public class InvoiceController : ControllerBase
{
    private readonly InvoiceService _service;

    public InvoiceController(InvoiceService service)
    {
        _service = service;
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
   
    [HttpGet]
    public async Task<IActionResult> GetAllInvoice([FromQuery] PaginationRequest request)
    {
        //var result = await _service.GetAllAsync(request);
        //return Ok(result);
        return Ok(await _service.GetAllAsync(request));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var invoice = await _service.GetByIdAsync(id);

        if(invoice == null)
        {
            return NotFound(new { message = "Invoice not Found" });
        }

        return Ok(invoice);
    }

    [Authorize(Roles = "Admin, Sales")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceDto dto)
    {
        try
        {
            var invoice = await _service.CreateAsync(dto, GetUserId());

            return CreatedAtAction(
                nameof(GetById),
                new { id = invoice.Id },
                invoice
                );
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch(ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateInvoiceDto dto)
    {
        try
        {
            var invoice = await _service.UpdateAsync(id, dto, GetUserId());

            if(invoice == null) { return null; }

            return Ok(invoice);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch(ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch(InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message, });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var deleted = await _service.DeleteAsync(id, GetUserId());

            if (!deleted)
            {
                return NotFound(new { message = "Invoice Not Found."});
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new {message = ex.Message});
        }
    }

}
