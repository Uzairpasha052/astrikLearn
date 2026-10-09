using backend.DTOs;
using backend.Model;
using backend.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controller;

// [Authorize]
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

        return Ok(new
        {
           message = "Registration Successfull",
           user = new
           {
               result.Id,
               result.Name,
               result.Mail,
               result.Role
           } 
        });
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

        var token = _service.GenerateToken(result);

        return Ok(new
        {
            message = "Login Successfull",
            token = token,
            user = new
            {
                result.Id,
                result.Name,
                result.Mail,
                result.Role
            }
        });
    }


    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public async Task<IActionResult> UserDisplay()
    {
        var user = await _service.UserDisplayAsync();

        return Ok(user);
    }

}
