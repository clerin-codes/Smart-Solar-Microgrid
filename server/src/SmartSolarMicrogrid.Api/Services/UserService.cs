/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: UserService.cs
 * Purpose: Implements registration, profile management,
 *          activation, deactivation, validation and
 *          account-lifecycle business rules.
 */

using SmartSolarMicrogrid.Api.DTOs.Auth;
using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public class UserService : IUserService
{
    private const int BcryptWorkFactor = 12;

    private readonly IUserRepository _userRepository;

    public UserService(
        IUserRepository userRepository)
    {
        // Store the account repository dependency.
        _userRepository = userRepository;
    }

    public async Task<List<UserResponseDto>> GetAllAsync(
        UserRole? role = null,
        AccountStatus? status = null)
    {
        // Apply role/status filters directly in MongoDB.
        var users =
            await _userRepository.GetFilteredAsync(
                role,
                status);

        return users
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<List<UserResponseDto>>
        GetPendingActivationsAsync()
    {
        // Retrieve registrations waiting for Backoffice approval.
        var users =
            await _userRepository.GetByStatusAsync(
                AccountStatus.PendingActivation);

        return users
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<List<UserResponseDto>>
        GetDeactivationRequestsAsync()
    {
        // Retrieve Prosumer deactivation requests.
        var users =
            await _userRepository.GetByStatusAsync(
                AccountStatus.DeactivationRequested);

        return users
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<UserResponseDto> GetByNICAsync(
        string nic)
    {
        // Retrieve an account using its normalized NIC.
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await _userRepository.GetByNICAsync(
                normalizedNic);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found.");
        }

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> CreateAsync(
        CreateUserDto request)
    {
        // Defend against a missing role even if model validation is bypassed.
        if (!request.Role.HasValue)
        {
            throw new ArgumentException(
                "User role is required.");
        }

        var role =
            request.Role.Value;

        // Prosumer accounts must use the dedicated registration
        // and Backoffice activation workflow.
        if (role == UserRole.Prosumer)
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
        await EnsureEmailAvailableAsync(email);

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

        await _userRepository.CreateAsync(
            user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto>
        RegisterProsumerAsync(
            RegisterProsumerDto request)
    {
        // Register public mobile users strictly as pending Prosumers.
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
        await EnsureEmailAvailableAsync(email);

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

        await _userRepository.CreateAsync(
            user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> UpdateAsync(
        string nic,
        UpdateUserDto request)
    {
        // Update only safe editable profile fields.
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await _userRepository.GetByNICAsync(
                normalizedNic);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found.");
        }

        var email =
            NormalizeEmail(
                request.Email);

        var phoneNumber =
            NormalizePhoneNumber(
                request.PhoneNumber);

        await EnsureEmailAvailableAsync(
            email,
            user.NIC);

        user.FullName =
            NormalizeFullName(
                request.FullName);

        user.Email =
            email;

        user.PhoneNumber =
            phoneNumber;

        user.UpdatedAt =
            DateTime.UtcNow;

        await _userRepository.UpdateAsync(
            user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto>
        RequestOwnDeactivationAsync(
            string nic)
    {
        // Place only an active Prosumer into the deactivation-request state.
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await _userRepository.GetByNICAsync(
                normalizedNic);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found.");
        }

        if (user.Role != UserRole.Prosumer)
        {
            throw new UnauthorizedAccessException(
                "Only Solar Prosumers can request self-deactivation.");
        }

        if (!user.IsActive ||
            user.Status != AccountStatus.Active)
        {
            throw new InvalidOperationException(
                "Only an active account can request deactivation.");
        }

        user.IsActive =
            false;

        user.Status =
            AccountStatus.DeactivationRequested;

        user.DeactivationRequestedAt =
            DateTime.UtcNow;

        user.UpdatedAt =
            DateTime.UtcNow;

        await _userRepository.UpdateAsync(
            user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> ActivateAsync(
        string nic)
    {
        // Approve only a pending Prosumer registration.
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await _userRepository.GetByNICAsync(
                normalizedNic);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found.");
        }

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

        await _userRepository.UpdateAsync(
            user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> DeactivateAsync(
        string nic)
    {
        // Finalize deactivation through Backoffice.
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await _userRepository.GetByNICAsync(
                normalizedNic);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found.");
        }

        if (!user.IsActive &&
            user.Status == AccountStatus.Deactivated)
        {
            throw new InvalidOperationException(
                "The account is already deactivated.");
        }

        user.IsActive =
            false;

        user.Status =
            AccountStatus.Deactivated;

        user.DeactivationRequestedAt ??=
            DateTime.UtcNow;

        user.UpdatedAt =
            DateTime.UtcNow;

        await _userRepository.UpdateAsync(
            user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> ReactivateAsync(
        string nic)
    {
        // Restore only an account whose deactivation was finalized.
        // Pending registrations must use ActivateAsync instead.
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await _userRepository.GetByNICAsync(
                normalizedNic);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found.");
        }

        if (user.IsActive ||
            user.Status != AccountStatus.Deactivated)
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

        await _userRepository.UpdateAsync(
            user);

        return MapToResponse(user);
    }

    private async Task EnsureNicAvailableAsync(
        string nic)
    {
        // NIC is the immutable MongoDB primary identifier.
        var existing =
            await _userRepository.GetByNICAsync(
                nic);

        if (existing != null)
        {
            throw new InvalidOperationException(
                "An account with this NIC already exists.");
        }
    }

    private async Task EnsureEmailAvailableAsync(
        string email,
        string? excludeNic = null)
    {
        // Prevent multiple accounts from sharing one normalized e-mail.
        var exists =
            await _userRepository.EmailExistsAsync(
                email,
                excludeNic);

        if (exists)
        {
            throw new InvalidOperationException(
                "An account with this e-mail already exists.");
        }
    }

    private static string NormalizeNic(
        string nic)
    {
        // Normalize the legacy V/X suffix while preserving the NIC value.
        return nic
            .Trim()
            .ToUpperInvariant();
    }

    private static string NormalizeFullName(
        string fullName)
    {
        // Collapse accidental repeated spaces before persistence.
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
        // Store e-mail addresses in one comparison-friendly form.
        return email
            .Trim()
            .ToLowerInvariant();
    }

    private static string NormalizePhoneNumber(
        string phoneNumber)
    {
        // Store +9477... and 077... inputs consistently as 07XXXXXXXX.
        var normalized =
            phoneNumber.Trim();

        if (normalized.StartsWith(
                "+94",
                StringComparison.Ordinal))
        {
            normalized =
                "0" + normalized[3..];
        }

        return normalized;
    }

    private static UserResponseDto MapToResponse(
        UserDetails user)
    {
        // Return only safe account properties; PasswordHash never leaves the API.
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