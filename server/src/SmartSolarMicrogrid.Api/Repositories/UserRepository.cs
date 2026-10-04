/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: UserRepository.cs
 * Purpose: Implements MongoDB persistence, indexes and account queries.
 */

using MongoDB.Driver;

using SmartSolarMicrogrid.Api.Exceptions;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IMongoCollection<UserDetails> _collection;

    public UserRepository(
        IMongoDatabase database)
    {
        // Resolve the UserDetails collection once for repository operations.
        _collection =
            database.GetCollection<UserDetails>(
                "UserDetails");
    }

    public async Task EnsureIndexesAsync()
    {
        // Enforce unique normalized emails and accelerate common role/status queries.
        var indexes =
            new List<CreateIndexModel<UserDetails>>
            {
                new(
                    Builders<UserDetails>
                        .IndexKeys
                        .Ascending(x => x.Email),
                    new CreateIndexOptions
                    {
                        Name =
                            "ux_userdetails_email",

                        Unique =
                            true
                    }),

                new(
                    Builders<UserDetails>
                        .IndexKeys
                        .Ascending(x => x.Status),
                    new CreateIndexOptions
                    {
                        Name =
                            "ix_userdetails_status"
                    }),

                new(
                    Builders<UserDetails>
                        .IndexKeys
                        .Ascending(x => x.Role),
                    new CreateIndexOptions
                    {
                        Name =
                            "ix_userdetails_role"
                    })
            };

        await _collection
            .Indexes
            .CreateManyAsync(indexes);
    }

    public async Task<UserDetails?> GetByNICAsync(
        string nic)
    {
        // Query the MongoDB primary key used for all account identity operations.
        return await _collection
            .Find(x => x.NIC == nic)
            .FirstOrDefaultAsync();
    }

    public async Task<List<UserDetails>> GetFilteredAsync(
        UserRole? role = null,
        AccountStatus? status = null)
    {
        // Build database-side filters so unnecessary account documents are not returned.
        var filter =
            Builders<UserDetails>
                .Filter
                .Empty;

        if (role.HasValue)
        {
            filter &=
                Builders<UserDetails>
                    .Filter
                    .Eq(
                        x => x.Role,
                        role.Value);
        }

        if (status.HasValue)
        {
            filter &=
                Builders<UserDetails>
                    .Filter
                    .Eq(
                        x => x.Status,
                        status.Value);
        }

        return await _collection
            .Find(filter)
            .SortByDescending(
                x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<UserDetails>> GetByStatusAsync(
        AccountStatus status)
    {
        // Return lifecycle queues ordered with the newest account activity first.
        return await _collection
            .Find(
                x =>
                    x.Status ==
                    status)
            .SortByDescending(
                x => x.UpdatedAt)
            .ToListAsync();
    }

    public async Task<bool> EmailExistsAsync(
        string email,
        string? excludeNic = null)
    {
        // Check normalized email uniqueness while allowing an account to keep its own email.
        var filter =
            Builders<UserDetails>
                .Filter
                .Eq(
                    x => x.Email,
                    email);

        if (!string.IsNullOrWhiteSpace(
                excludeNic))
        {
            filter &=
                Builders<UserDetails>
                    .Filter
                    .Ne(
                        x => x.NIC,
                        excludeNic);
        }

        return await _collection
            .Find(filter)
            .AnyAsync();
    }

    public async Task CreateAsync(
        UserDetails user)
    {
        // Insert the account and convert duplicate-key races into HTTP 409 conflicts.
        try
        {
            await _collection
                .InsertOneAsync(user);
        }
        catch (MongoWriteException ex)
            when (
                ex.WriteError?.Category ==
                ServerErrorCategory.DuplicateKey)
        {
            throw new ConflictException(
                "An account with this NIC or e-mail already exists.",
                ex);
        }
    }

    public async Task UpdateAsync(
        UserDetails user)
    {
        // Replace the account identified by immutable NIC and preserve duplicate-email handling.
        try
        {
            var result =
                await _collection
                    .ReplaceOneAsync(
                        x =>
                            x.NIC ==
                            user.NIC,

                        user);

            if (result.MatchedCount == 0)
            {
                throw new KeyNotFoundException(
                    "User not found.");
            }
        }
        catch (MongoWriteException ex)
            when (
                ex.WriteError?.Category ==
                ServerErrorCategory.DuplicateKey)
        {
            throw new ConflictException(
                "An account with this e-mail already exists.",
                ex);
        }
    }
}