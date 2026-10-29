using backend.DTOs;
using backend.DTOs.Pagination;
using backend.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controller;

[ApiController]
[Route("api/user")]
[Authorize(Roles = "Admin")]
public class UserController : ControllerBase
{
    private readonly UserService _service;

    public UserController(UserService authService)
    {
        _service = authService;
    }

    [HttpGet]
    public async Task<IActionResult> UserDisplay([FromQuery] PaginationRequest request)
    {
        var user = await _service.UserDisplayAsync(request);

        return Ok(user);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
    {
        var currentUser = GetUserId();
        if (currentUser == null) { return Unauthorized(); }

        try
        {
            var result = await _service.UpdateAsync(id, dto, currentUser.Value);

            if(result == null)
            {
                return NotFound(new { message = "User not Found" });
            }

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch(InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var currentUser = GetUserId();
        if (currentUser == null) { return Unauthorized(); }

        try
        {
            bool deleted = await _service.DeleteAsync(id, currentUser.Value);

            if (!deleted)
            {
                return NotFound(new { message = "User not Found" });
            }
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
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
