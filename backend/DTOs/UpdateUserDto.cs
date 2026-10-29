using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class UpdateUserDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    [Required]
    [Range(1, int.MaxValue)]
    public int RoleId { get; set; }

}
