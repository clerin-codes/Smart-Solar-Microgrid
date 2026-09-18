using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<List<UserDetails>> GetAllAsync()
    {
        return await _userRepository.GetAllAsync();
    }

    public async Task<UserDetails?> GetByNICAsync(string nic)
    {
        return await _userRepository.GetByNICAsync(nic);
    }

    public async Task<UserDetails> CreateAsync(
        CreateUserDto request)
    {
        var existingUser =
            await _userRepository.GetByNICAsync(request.NIC);

        if (existingUser != null)
        {
            throw new InvalidOperationException(
                "A user with this NIC already exists.");
        }

        var user = new UserDetails
        {
            NIC = request.NIC,
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,

            // Temporary password handling.
            // BCrypt authentication will be completed in Step 8.
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                request.Password),

            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateAsync(user);

        return user;
    }

    public async Task<UserDetails> UpdateAsync(
        string nic,
        UpdateUserDto request)
    {
        var user =
            await _userRepository.GetByNICAsync(nic);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found.");
        }

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.PhoneNumber = request.PhoneNumber;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);

        return user;
    }

    public async Task DeactivateAsync(string nic)
    {
        var user =
            await _userRepository.GetByNICAsync(nic);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found.");
        }

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
    }

    public async Task ReactivateAsync(string nic)
    {
        var user =
            await _userRepository.GetByNICAsync(nic);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found.");
        }

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
    }
}