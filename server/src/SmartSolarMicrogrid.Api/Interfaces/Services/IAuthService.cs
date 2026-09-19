using SmartSolarMicrogrid.Api.DTOs.Auth;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request);
}