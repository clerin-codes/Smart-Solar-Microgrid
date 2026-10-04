/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: UserService.cs
 * Purpose: Implements registration, profile management, password security and account lifecycle rules.
 */

using SmartSolarMicrogrid.Api.DTOs.Auth;
using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Exceptions;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public class UserService : IUserService
{
    private const int BcryptWorkFactor =
        12;

    private readonly IUserRepository _userRepository;

    public UserService(
        IUserRepository userRepository)
    {
        // Store the repository used by all account-management business operations.
        _userRepository =
            userRepository;
    }

    public async Task<List<UserResponseDto>> GetAllAsync(
        UserRole? role = null,
        AccountStatus? status = null)
    {
        // Apply optional role/status filters in MongoDB and expose only safe response fields.
        var users =
            await _userRepository
                .GetFilteredAsync(
                    role,
                    status);

        return users
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<List<UserResponseDto>>
        GetPendingActivationsAsync()
    {
        // Return only pending Prosumer registrations expected by the Backoffice activation screen.
        var users =
            await _userRepository
                .GetByStatusAsync(
                    AccountStatus.PendingActivation);

        return users
            .Where(
                user =>
                    user.Role ==
                    UserRole.Prosumer)
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<List<UserResponseDto>>
        GetDeactivationRequestsAsync()
    {
        // Return only Prosumer requests waiting for Backoffice deactivation finalization.
        var users =
            await _userRepository
                .GetByStatusAsync(
                    AccountStatus.DeactivationRequested);

        return users
            .Where(
                user =>
                    user.Role ==
                    UserRole.Prosumer)
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<UserResponseDto> GetByNICAsync(
        string nic)
    {
        // Load the requested account after applying one consistent NIC normalization rule.
        var user =
            await GetRequiredUserAsync(
                NormalizeNic(nic));

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> CreateAsync(
        CreateUserDto request)
    {
        // Restrict Backoffice-created web accounts to Backoffice and Grid Operator roles.
        if (!request.Role.HasValue)
        {
            throw new ArgumentException(
                "User role is required.");
        }

        var role =
            request.Role.Value;

        if (role ==
            UserRole.Prosumer)
        {
            throw new InvalidOperationException(
                "Prosumer accounts must be created through the Prosumer registration workflow.");
        }

        var nic =
            NormalizeNic(
                request.NIC);

        var email =
            NormalizeEmail(
                request.Email);

        var phoneNumber =
            NormalizePhoneNumber(
                request.PhoneNumber);

        await EnsureNicAvailableAsync(nic);

        await EnsureEmailAvailableAsync(
            email);

        var now =
            DateTime.UtcNow;

        var user =
            new UserDetails
            {
                NIC =
                    nic,

                FullName =
                    NormalizeFullName(
                        request.FullName),

                Email =
                    email,

                PhoneNumber =
                    phoneNumber,

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        request.Password,
                        workFactor:
                            BcryptWorkFactor),

                Role =
                    role,

                IsActive =
                    true,

                Status =
                    AccountStatus.Active,

                DeactivationRequestedAt =
                    null,

                CreatedAt =
                    now,

                UpdatedAt =
                    now
            };

        await _userRepository
            .CreateAsync(user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto>
        RegisterProsumerAsync(
            RegisterProsumerDto request)
    {
        // Create every public mobile registration as an inactive pending Prosumer.
        var nic =
            NormalizeNic(
                request.NIC);

        var email =
            NormalizeEmail(
                request.Email);

        var phoneNumber =
            NormalizePhoneNumber(
                request.PhoneNumber);

        await EnsureNicAvailableAsync(
            nic);

        await EnsureEmailAvailableAsync(
            email);

        var now =
            DateTime.UtcNow;

        var user =
            new UserDetails
            {
                NIC =
                    nic,

                FullName =
                    NormalizeFullName(
                        request.FullName),

                Email =
                    email,

                PhoneNumber =
                    phoneNumber,

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        request.Password,
                        workFactor:
                            BcryptWorkFactor),

                Role =
                    UserRole.Prosumer,

                IsActive =
                    false,

                Status =
                    AccountStatus.PendingActivation,

                DeactivationRequestedAt =
                    null,

                CreatedAt =
                    now,

                UpdatedAt =
                    now
            };

        await _userRepository
            .CreateAsync(user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> UpdateAsync(
        string nic,
        UpdateUserDto request)
    {
        // Change only editable profile fields; NIC, role and lifecycle state remain immutable here.
        var user =
            await GetRequiredUserAsync(
                NormalizeNic(nic));

        var email =
            NormalizeEmail(
                request.Email);

        await EnsureEmailAvailableAsync(
            email,
            user.NIC);

        user.FullName =
            NormalizeFullName(
                request.FullName);

        user.Email =
            email;

        user.PhoneNumber =
            NormalizePhoneNumber(
                request.PhoneNumber);

        user.UpdatedAt =
            DateTime.UtcNow;

        await _userRepository
            .UpdateAsync(user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto>
        RequestOwnDeactivationAsync(
            string nic)
    {
        // Allow only an active Prosumer to create one deactivation request for their own account.
        var user =
            await GetRequiredUserAsync(
                NormalizeNic(nic));

        if (user.Role !=
            UserRole.Prosumer)
        {
            throw new UnauthorizedAccessException(
                "Only Solar Prosumers can request self-deactivation.");
        }

        if (!user.IsActive ||
            user.Status !=
            AccountStatus.Active)
        {
            throw new InvalidOperationException(
                "Only an active Prosumer account can request deactivation.");
        }

        var now =
            DateTime.UtcNow;

        user.IsActive =
            false;

        user.Status =
            AccountStatus.DeactivationRequested;

        user.DeactivationRequestedAt =
            now;

        user.UpdatedAt =
            now;

        await _userRepository
            .UpdateAsync(user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> ActivateAsync(
        string nic)
    {
        // Approve only an inactive pending Prosumer registration.
        var user =
            await GetRequiredUserAsync(
                NormalizeNic(nic));

        if (user.Role != UserRole.Prosumer ||
            user.Status != AccountStatus.PendingActivation ||
            user.IsActive)
        {
            throw new InvalidOperationException(
                "Only pending Prosumer accounts can be activated.");
        }

        user.IsActive =
            true;

        user.Status =
            AccountStatus.Active;

        user.DeactivationRequestedAt =
            null;

        user.UpdatedAt =
            DateTime.UtcNow;

        await _userRepository
            .UpdateAsync(user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> DeactivateAsync(
        string nic)
    {
        // Soft-deactivate an active managed account or finalize a Prosumer deactivation request.
        var user =
            await GetRequiredUserAsync(
                NormalizeNic(nic));

        if (user.Status ==
            AccountStatus.Deactivated)
        {
            throw new InvalidOperationException(
                "The account is already deactivated.");
        }

        if (user.Status ==
            AccountStatus.PendingActivation)
        {
            throw new InvalidOperationException(
                "A pending Prosumer registration must be activated before it can be deactivated.");
        }

        user.IsActive =
            false;

        user.Status =
            AccountStatus.Deactivated;

        user.UpdatedAt =
            DateTime.UtcNow;

        await _userRepository
            .UpdateAsync(user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> ReactivateAsync(
        string nic)
    {
        // Restore only a finalized deactivated account; pending registrations use ActivateAsync.
        var user =
            await GetRequiredUserAsync(
                NormalizeNic(nic));

        if (user.IsActive ||
            user.Status !=
            AccountStatus.Deactivated)
        {
            throw new InvalidOperationException(
                "Only deactivated accounts can be reactivated.");
        }

        user.IsActive =
            true;

        user.Status =
            AccountStatus.Active;

        user.DeactivationRequestedAt =
            null;

        user.UpdatedAt =
            DateTime.UtcNow;

        await _userRepository
            .UpdateAsync(user);

        return MapToResponse(user);
    }

    public async Task ChangePasswordAsync(
        string nic,
        ChangePasswordDto request)
    {
        // Load the authenticated account using its immutable NIC identity.
        var user =
            await GetRequiredUserAsync(
                NormalizeNic(nic));

        // Require knowledge of the current password before accepting a replacement.
        if (!BCrypt.Net.BCrypt.Verify(
                request.CurrentPassword,
                user.PasswordHash))
        {
            throw new InvalidOperationException(
                "Current password is incorrect.");
        }

        // Prevent a no-op password change even when the new value passes complexity validation.
        if (BCrypt.Net.BCrypt.Verify(
                request.NewPassword,
                user.PasswordHash))
        {
            throw new InvalidOperationException(
                "New password must be different from the current password.");
        }

        // Re-hash using the same explicit work factor used for account creation and registration.
        user.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword(
                request.NewPassword,
                workFactor:
                    BcryptWorkFactor);

        user.UpdatedAt =
            DateTime.UtcNow;

        await _userRepository
            .UpdateAsync(user);
    }

    private async Task<UserDetails> GetRequiredUserAsync(
        string normalizedNic)
    {
        // Centralize not-found handling so every account operation behaves consistently.
        var user =
            await _userRepository
                .GetByNICAsync(
                    normalizedNic);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found.");
        }

        return user;
    }

    private async Task EnsureNicAvailableAsync(
        string nic)
    {
        // Report duplicate immutable NIC values as an HTTP 409 conflict.
        if (await _userRepository
                .GetByNICAsync(nic) !=
            null)
        {
            throw new ConflictException(
                "An account with this NIC already exists.");
        }
    }

    private async Task EnsureEmailAvailableAsync(
        string email,
        string? excludeNic = null)
    {
        // Report duplicate normalized e-mail values as an HTTP 409 conflict.
        if (await _userRepository
                .EmailExistsAsync(
                    email,
                    excludeNic))
        {
            throw new ConflictException(
                "An account with this e-mail already exists.");
        }
    }

    private static string NormalizeNic(
        string nic)
    {
        // Normalize legacy NIC suffix casing while preserving the submitted identity value.
        return nic
            .Trim()
            .ToUpperInvariant();
    }

    private static string NormalizeFullName(
        string fullName)
    {
        // Collapse repeated spaces so persisted names have a consistent representation.
        return string.Join(
            ' ',
            fullName
                .Trim()
                .Split(
                    ' ',
                    StringSplitOptions.RemoveEmptyEntries));
    }

    private static string NormalizeEmail(
        string email)
    {
        // Store e-mail addresses in lowercase to support deterministic uniqueness checks.
        return email
            .Trim()
            .ToLowerInvariant();
    }

    private static string NormalizePhoneNumber(
        string phoneNumber)
    {
        // Store both accepted Sri Lankan formats consistently as 07XXXXXXXX.
        var normalized =
            phoneNumber.Trim();

        if (normalized.StartsWith(
                "+94",
                StringComparison.Ordinal))
        {
            normalized =
                "0" +
                normalized[3..];
        }

        return normalized;
    }

    private static UserResponseDto MapToResponse(
        UserDetails user)
    {
        // Return only safe account properties; PasswordHash never leaves the API boundary.
        return new UserResponseDto
        {
            NIC =
                user.NIC,

            FullName =
                user.FullName,

            Email =
                user.Email,

            PhoneNumber =
                user.PhoneNumber,

            Role =
                user.Role,

            IsActive =
                user.IsActive,

            Status =
                user.Status,

            DeactivationRequestedAt =
                user.DeactivationRequestedAt,

            CreatedAt =
                user.CreatedAt,

            UpdatedAt =
                user.UpdatedAt
        };
    }
}