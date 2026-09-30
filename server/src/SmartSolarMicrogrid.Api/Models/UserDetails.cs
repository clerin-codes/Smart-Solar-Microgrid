using System.Text.Json.Serialization;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.Api.Models;

public class UserDetails
{
    [BsonId]
    public string NIC { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Profile picture as base64 (no "data:" prefix), JPEG, PNG or WebP. Kept out of the raw user JSON
    /// (GET /api/users) so those lists stay small; the profile endpoints return it.
    /// </summary>
    [BsonIgnoreIfNull]
    [JsonIgnore]
    public string? ProfileImage { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}