
using backend.DTOs.Pagination;
using backend.DTOs.Reminder;
using backend.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controller;

[Authorize]
[ApiController]
[Route("api/reminder")]
public class ReminderController : ControllerBase
{
    private readonly ReminderService _service;

    public ReminderController(ReminderService service)
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
    public async Task<IActionResult> GetAll([FromQuery] PaginationRequest request)
    {
        var reminders = await _service.GetAllAsync(request);

        return Ok(reminders);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var reminder = await _service.GetByIdAsync(id);

        if (reminder == null)
            return NotFound(new { message = "Reminder not found." });

        return Ok(reminder);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateReminderDto dto)
    {
        try
        {
            var reminder = await _service.CreateAsync(
                dto,
                GetUserId());

            return CreatedAtAction(
                nameof(GetById),
                new { id = reminder.Id },
                reminder);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateReminderDto dto)
    {
        try
        {
            var reminder = await _service.UpdateAsync(
                id,
                dto,
                GetUserId());

            if (reminder == null)
                return NotFound(new { message = "Reminder not found." });

            return Ok(reminder);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(
            id,
            GetUserId());

        if (!deleted)
            return NotFound(new { message = "Reminder not found." });

        return NoContent();
    }

}
