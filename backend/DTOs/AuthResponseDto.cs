namespace backend.DTOs;

public class AuthResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Mail { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}
