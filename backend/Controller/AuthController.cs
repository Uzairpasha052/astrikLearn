using backend.DTOs;
using backend.DTOs.Pagination;
using backend.Model;
using backend.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controller;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _service;

    public AuthController(AuthService authService)
    {
        _service = authService;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _service.RegisterAsync(dto);

        if(result == null)
        {
            return BadRequest(new
            {
                message = "Email already exist"
            });
        }

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _service.LoginAsync(dto);

        if(result == null)
        {
            return Unauthorized(new
            {
                message = "Invalid Email or Password"
            });
        }

        return Ok(result);
    }


    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public async Task<IActionResult> UserDisplay([FromQuery] PaginationRequest request)
    {
        var user = await _service.UserDisplayAsync(request);

        return Ok(user);
    }

}
