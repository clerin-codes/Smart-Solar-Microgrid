/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: UserRepository.cs
 * Purpose: Implements MongoDB persistence, indexing and queries
 *          for UserDetails accounts.
 */

using MongoDB.Driver;

using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IMongoCollection<UserDetails> _collection;

    public UserRepository(
        IMongoDatabase database)
    {
        // Obtain the UserDetails MongoDB collection.
        _collection =
            database.GetCollection<UserDetails>(
                "UserDetails");
    }

    public async Task EnsureIndexesAsync()
    {
        // Create database-level indexes that enforce unique e-mail
        // addresses and improve common role/status queries.
        var indexes =
            new List<CreateIndexModel<UserDetails>>
            {
                new(
                    Builders<UserDetails>.IndexKeys
                        .Ascending(x => x.Email),
                    new CreateIndexOptions
                    {
                        Name = "ux_userdetails_email",
                        Unique = true
                    }),

                new(
                    Builders<UserDetails>.IndexKeys
                        .Ascending(x => x.Status),
                    new CreateIndexOptions
                    {
                        Name = "ix_userdetails_status"
                    }),

                new(
                    Builders<UserDetails>.IndexKeys
                        .Ascending(x => x.Role),
                    new CreateIndexOptions
                    {
                        Name = "ix_userdetails_role"
                    })
            };

        await _collection.Indexes
            .CreateManyAsync(indexes);
    }

    public async Task<UserDetails?> GetByNICAsync(
        string nic)
    {
        // Retrieve one account using NIC as the primary key.
        return await _collection
            .Find(x => x.NIC == nic)
            .FirstOrDefaultAsync();
    }

    public async Task<UserDetails?> GetByEmailAsync(string email)
    {
        // Emails are compared case-insensitively.
        var normalised = email.ToLower();

        return await _collection
            .Find(x => x.Email.ToLower() == normalised)
            .FirstOrDefaultAsync();
    }

    public async Task<List<UserDetails>> GetAllAsync()
    {
        // Retrieve all user accounts ordered newest first.
        return await _collection
            .Find(_ => true)
            .SortByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<UserDetails>> GetFilteredAsync(
        UserRole? role = null,
        AccountStatus? status = null)
    {
        // Build optional MongoDB-side filters.
        var filter =
            Builders<UserDetails>.Filter.Empty;

        if (role.HasValue)
        {
            filter &=
                Builders<UserDetails>.Filter.Eq(
                    x => x.Role,
                    role.Value);
        }

        if (status.HasValue)
        {
            filter &=
                Builders<UserDetails>.Filter.Eq(
                    x => x.Status,
                    status.Value);
        }

        return await _collection
            .Find(filter)
            .SortByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<UserDetails>> GetByStatusAsync(
        AccountStatus status)
    {
        // Retrieve accounts matching the supplied lifecycle status.
        return await _collection
            .Find(x => x.Status == status)
            .SortByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> EmailExistsAsync(
        string email,
        string? excludeNic = null)
    {
        // Build a duplicate-email query while optionally excluding
        // the account currently being edited.
        var filter =
            Builders<UserDetails>.Filter.Eq(
                x => x.Email,
                email);

        if (!string.IsNullOrWhiteSpace(
                excludeNic))
        {
            filter &=
                Builders<UserDetails>.Filter.Ne(
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
        // Insert a new account and translate duplicate-key races
        // into a controlled validation error.
        try
        {
            await _collection.InsertOneAsync(
                user);
        }
        catch (MongoWriteException ex)
            when (ex.WriteError?.Category ==
                  ServerErrorCategory.DuplicateKey)
        {
            throw new InvalidOperationException(
                "An account with this NIC or e-mail already exists.",
                ex);
        }
    }

    public async Task UpdateAsync(
        UserDetails user)
    {
        // Replace the account identified by the immutable NIC.
        try
        {
            var result =
                await _collection.ReplaceOneAsync(
                    x => x.NIC == user.NIC,
                    user);

            if (result.MatchedCount == 0)
            {
                throw new KeyNotFoundException(
                    "User not found.");
            }
        }
        catch (MongoWriteException ex)
            when (ex.WriteError?.Category ==
                  ServerErrorCategory.DuplicateKey)
        {
            throw new InvalidOperationException(
                "An account with this e-mail already exists.",
                ex);
        }
    }
}