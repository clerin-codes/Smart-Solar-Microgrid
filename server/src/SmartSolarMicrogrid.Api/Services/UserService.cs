/*
 * Smart Solar Microgrid Trading System
 *
 * Author: Sahanya - IT23214002
 * File: UserService.cs
 *
 * Purpose:
 * Implements the business logic for authentication-related user management,
 * Prosumer registration, profile updates, password security, and account
 * lifecycle operations. Business rules are enforced in the API so that
 * client applications remain presentation layers only.
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
    /*
     * Use one explicit BCrypt work factor for account creation,
     * Prosumer registration, and password changes.
     */
    private const int BcryptWorkFactor = 12;

    private readonly IUserRepository _userRepository;

    public UserService(
        IUserRepository userRepository)
    {
        // Store the repository dependency used by account-management operations.
        _userRepository = userRepository;
    }

    public async Task<List<UserResponseDto>> GetAllAsync(
        UserRole? role = null,
        AccountStatus? status = null)
    {
        // Retrieve users using optional role and account-status filters.
        var users =
            await _userRepository.GetFilteredAsync(
                role,
                status);

        // Return safe response DTOs rather than exposing database entities.
        return users
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<List<UserResponseDto>>
        GetPendingActivationsAsync()
    {
        // Retrieve registrations that are waiting for Backoffice activation.
        var users =
            await _userRepository.GetByStatusAsync(
                AccountStatus.PendingActivation);

        // Only mobile Prosumer registrations belong in the pending-activation queue.
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
        // Retrieve accounts currently waiting for Backoffice deactivation finalization.
        var users =
            await _userRepository.GetByStatusAsync(
                AccountStatus.DeactivationRequested);

        // Only Prosumer self-deactivation requests are shown in this workflow.
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
        // Normalize the immutable NIC before retrieving the requested account.
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await GetRequiredUserAsync(
                normalizedNic);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> CreateAsync(
        CreateUserDto request)
    {
        // Restrict Backoffice-created web accounts to valid web-user roles.
        if (!request.Role.HasValue)
        {
            throw new ArgumentException(
                "User role is required.");
        }

        var role =
            request.Role.Value;

        // Prosumer accounts must use the dedicated mobile registration workflow.
        if (role ==
            UserRole.Prosumer)
        {
            throw new InvalidOperationException(
                "Prosumer accounts must be created through the Prosumer registration workflow.");
        }

        // Normalize identity and contact values before uniqueness checks and persistence.
        var nic =
            NormalizeNic(
                request.NIC);

        var email =
            NormalizeEmail(
                request.Email);

        var phoneNumber =
            NormalizePhoneNumber(
                request.PhoneNumber);

        // NIC and e-mail must remain unique across all accounts.
        await EnsureNicAvailableAsync(
            nic);

        await EnsureEmailAvailableAsync(
            email);

        var now =
            DateTime.UtcNow;

        // Web accounts created by Backoffice become active immediately.
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
        // Normalize registration values before performing duplicate checks.
        var nic =
            NormalizeNic(
                request.NIC);

        var email =
            NormalizeEmail(
                request.Email);

        var phoneNumber =
            NormalizePhoneNumber(
                request.PhoneNumber);

        // Prevent duplicate NIC and e-mail registrations.
        await EnsureNicAvailableAsync(
            nic);

        await EnsureEmailAvailableAsync(
            email);

        var now =
            DateTime.UtcNow;

        /*
         * Public/mobile registrations are always created as pending Prosumers.
         * A Backoffice officer must activate the account before normal access
         * is permitted.
         */
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
        /*
         * Update only editable profile information.
         * NIC, role, password and lifecycle status are not modified here.
         */
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await GetRequiredUserAsync(
                normalizedNic);

        var email =
            NormalizeEmail(
                request.Email);

        // Allow the user's existing e-mail while blocking another user's e-mail.
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

        await _userRepository.UpdateAsync(
            user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto>
        RequestOwnDeactivationAsync(
            string nic)
    {
        // Load the authenticated account using its normalized immutable NIC.
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await GetRequiredUserAsync(
                normalizedNic);

        // Self-deactivation requests belong only to Solar Prosumers.
        if (user.Role !=
            UserRole.Prosumer)
        {
            throw new UnauthorizedAccessException(
                "Only Solar Prosumers can request self-deactivation.");
        }

        // Prevent duplicate or invalid deactivation requests.
        if (!user.IsActive ||
            user.Status !=
            AccountStatus.Active)
        {
            throw new InvalidOperationException(
                "Only an active Prosumer account can request deactivation.");
        }

        var now =
            DateTime.UtcNow;

        /*
         * Move the account into the request state.
         * Backoffice must later finalize the deactivation.
         */
        user.IsActive =
            false;

        user.Status =
            AccountStatus.DeactivationRequested;

        user.DeactivationRequestedAt =
            now;

        user.UpdatedAt =
            now;

        await _userRepository.UpdateAsync(
            user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> ActivateAsync(
        string nic)
    {
        // Load the pending registration using its normalized NIC.
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await GetRequiredUserAsync(
                normalizedNic);

        // Activation is reserved for inactive pending Prosumer registrations.
        if (user.Role !=
                UserRole.Prosumer ||
            user.Status !=
                AccountStatus.PendingActivation ||
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
        /*
         * Soft-deactivate a managed account or finalize an existing
         * Prosumer deactivation request.
         */
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await GetRequiredUserAsync(
                normalizedNic);

        // Avoid repeating an already completed lifecycle operation.
        if (user.Status ==
            AccountStatus.Deactivated)
        {
            throw new InvalidOperationException(
                "The account is already deactivated.");
        }

        /*
         * Pending Prosumer registrations must use the activation workflow
         * before they can enter the normal deactivation lifecycle.
         */
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

        await _userRepository.UpdateAsync(
            user);

        return MapToResponse(user);
    }

    public async Task<UserResponseDto> ReactivateAsync(
        string nic)
    {
        // Retrieve the account that Backoffice intends to restore.
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await GetRequiredUserAsync(
                normalizedNic);

        /*
         * Reactivation applies only after deactivation has been finalized.
         * Pending registrations must use ActivateAsync instead.
         */
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

        await _userRepository.UpdateAsync(
            user);

        return MapToResponse(user);
    }

    public async Task ChangePasswordAsync(
        string nic,
        ChangePasswordDto request)
    {
        // Load the authenticated account using its immutable NIC identity.
        var normalizedNic =
            NormalizeNic(nic);

        var user =
            await GetRequiredUserAsync(
                normalizedNic);

        // Verify knowledge of the existing password before allowing replacement.
        if (!BCrypt.Net.BCrypt.Verify(
                request.CurrentPassword,
                user.PasswordHash))
        {
            throw new InvalidOperationException(
                "Current password is incorrect.");
        }

        // Prevent replacing the password with the same current password.
        if (BCrypt.Net.BCrypt.Verify(
                request.NewPassword,
                user.PasswordHash))
        {
            throw new InvalidOperationException(
                "New password must be different from the current password.");
        }

        /*
         * Hash the replacement password using the same explicit work factor
         * used for account creation and Prosumer registration.
         */
        user.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword(
                request.NewPassword,
                workFactor:
                    BcryptWorkFactor);

        user.UpdatedAt =
            DateTime.UtcNow;

        await _userRepository.UpdateAsync(
            user);
    }

    /* =====================================================
       Private Helpers
    ===================================================== */

    private async Task<UserDetails> GetRequiredUserAsync(
        string normalizedNic)
    {
        // Centralize account lookup and not-found handling for service operations.
        var user =
            await _userRepository.GetByNICAsync(
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
        // NIC is the immutable MongoDB identifier and therefore must remain unique.
        var existing =
            await _userRepository.GetByNICAsync(
                nic);

        if (existing != null)
        {
            throw new ConflictException(
                "An account with this NIC already exists.");
        }
    }

    private async Task EnsureEmailAvailableAsync(
        string email,
        string? excludeNic = null)
    {
        /*
         * Check the normalized e-mail against all other accounts.
         * excludeNic allows an existing user to retain their own e-mail.
         */
        var exists =
            await _userRepository.EmailExistsAsync(
                email,
                excludeNic);

        if (exists)
        {
            throw new ConflictException(
                "An account with this e-mail already exists.");
        }
    }

    private static string NormalizeNic(
        string nic)
    {
        // Normalize whitespace and legacy V/X suffix casing before comparison.
        return nic
            .Trim()
            .ToUpperInvariant();
    }

    private static string NormalizeFullName(
        string fullName)
    {
        // Remove leading/trailing whitespace and collapse repeated spaces.
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
        // Store e-mail addresses in lowercase for deterministic uniqueness checks.
        return email
            .Trim()
            .ToLowerInvariant();
    }

    private static string NormalizePhoneNumber(
        string phoneNumber)
    {
        // Normalize accepted Sri Lankan +94 mobile numbers to the 07XXXXXXXX format.
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
        /*
         * Map the database entity to the public account response.
         * PasswordHash is deliberately never exposed outside the API.
         */
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