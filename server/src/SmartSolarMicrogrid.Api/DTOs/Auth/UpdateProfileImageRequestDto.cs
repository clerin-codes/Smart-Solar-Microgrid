namespace SmartSolarMicrogrid.Api.DTOs.Auth;

public class UpdateProfileImageRequestDto
{
    /// <summary>Base64 of a JPEG, PNG or WebP image. A "data:image/...;base64," prefix is accepted and removed.</summary>
    public string ImageBase64 { get; set; } = string.Empty;
}
