/*
 * Smart Solar Microgrid Trading System
 * Author: Sahanya - IT23214002
 * File: UserRepository.cs
 * Purpose: Implements MongoDB persistence, indexes and account queries
 *          for authentication and user account management.
 */

using MongoDB.Driver;

using SmartSolarMicrogrid.Api.Exceptions;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

/// <summary>
/// Provides MongoDB persistence operations for user accounts.
/// NIC is used as the immutable primary identifier for each account.
/// </summary>
public class UserRepository : IUserRepository
{
    private const string CollectionName = "UserDetails";

    private readonly IMongoCollection<UserDetails> _collection;

    /// <summary>
    /// Initializes the repository using the UserDetails MongoDB collection.
    /// </summary>
    /// <param name="database">
    /// MongoDB database instance supplied through dependency injection.
    /// </param>
    public UserRepository(
        IMongoDatabase database)
    {
        // Resolve the UserDetails collection once for all repository operations.
        _collection =
            database.GetCollection<UserDetails>(
                CollectionName);
    }

    /// <summary>
    /// Creates the indexes required for account uniqueness
    /// and efficient lifecycle queries.
    /// </summary>
    public async Task EnsureIndexesAsync()
    {
        // Enforce unique e-mail addresses and accelerate common status and role queries.
        var indexes =
            new List<CreateIndexModel<UserDetails>>
            {
                new(
                    Builders<UserDetails>
                        .IndexKeys
                        .Ascending(
                            x => x.Email),
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
                        .Ascending(
                            x => x.Status),
                    new CreateIndexOptions
                    {
                        Name =
                            "ix_userdetails_status"
                    }),

                new(
                    Builders<UserDetails>
                        .IndexKeys
                        .Ascending(
                            x => x.Role),
                    new CreateIndexOptions
                    {
                        Name =
                            "ix_userdetails_role"
                    })
            };

        await _collection
            .Indexes
            .CreateManyAsync(
                indexes);
    }

    /// <summary>
    /// Retrieves a user account using NIC.
    /// </summary>
    /// <param name="nic">
    /// National Identity Card number used as the account primary key.
    /// </param>
    /// <returns>
    /// The matching user or null when the account does not exist.
    /// </returns>
    public async Task<UserDetails?> GetByNICAsync(
        string nic)
    {
        // Query the immutable NIC primary key used for account identity operations.
        return await _collection
            .Find(
                x =>
                    x.NIC ==
                    nic)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Retrieves users using optional role and account-status filters.
    /// </summary>
    /// <param name="role">
    /// Optional user role filter.
    /// </param>
    /// <param name="status">
    /// Optional account lifecycle status filter.
    /// </param>
    /// <returns>
    /// Matching accounts ordered from newest to oldest.
    /// </returns>
    public async Task<List<UserDetails>> GetFilteredAsync(
        UserRole? role = null,
        AccountStatus? status = null)
    {
        // Build MongoDB-side filters so unnecessary account documents are not returned.
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

    /// <summary>
    /// Retrieves accounts belonging to a particular lifecycle status.
    /// </summary>
    /// <param name="status">
    /// Account lifecycle status to query.
    /// </param>
    /// <returns>
    /// Matching accounts ordered by the most recent update.
    /// </returns>
    public async Task<List<UserDetails>> GetByStatusAsync(
        AccountStatus status)
    {
        // Return lifecycle queues with the most recently updated accounts first.
        return await _collection
            .Find(
                x =>
                    x.Status ==
                    status)
            .SortByDescending(
                x => x.UpdatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Checks whether an e-mail address is already used by another account.
    /// </summary>
    /// <param name="email">
    /// E-mail address to check.
    /// </param>
    /// <param name="excludeNic">
    /// Optional NIC to exclude while updating an existing account.
    /// </param>
    /// <returns>
    /// True when another account already uses the supplied e-mail address.
    /// </returns>
    public async Task<bool> EmailExistsAsync(
        string email,
        string? excludeNic = null)
    {
        // Normalize the e-mail before checking the unique account value.
        var normalizedEmail =
            email
                .Trim()
                .ToLowerInvariant();

        var filter =
            Builders<UserDetails>
                .Filter
                .Eq(
                    x => x.Email,
                    normalizedEmail);

        if (!string.IsNullOrWhiteSpace(
                excludeNic))
        {
            // Exclude the account currently being edited from the duplicate check.
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

    /// <summary>
    /// Inserts a new user account into MongoDB.
    /// </summary>
    /// <param name="user">
    /// Account document to create.
    /// </param>
    /// <exception cref="ConflictException">
    /// Thrown when the NIC or e-mail already exists.
    /// </exception>
    public async Task CreateAsync(
        UserDetails user)
    {
        // Insert the account and translate duplicate-key races into HTTP 409 conflicts.
        try
        {
            await _collection
                .InsertOneAsync(
                    user);
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

    /// <summary>
    /// Replaces an existing account identified by its immutable NIC.
    /// </summary>
    /// <param name="user">
    /// Updated account document.
    /// </param>
    /// <exception cref="KeyNotFoundException">
    /// Thrown when the account does not exist.
    /// </exception>
    /// <exception cref="ConflictException">
    /// Thrown when another account already uses the e-mail address.
    /// </exception>
    public async Task UpdateAsync(
        UserDetails user)
    {
        // Replace the account using NIC while preserving database-level uniqueness checks.
        try
        {
            var result =
                await _collection
                    .ReplaceOneAsync(
                        x =>
                            x.NIC ==
                            user.NIC,

                        user);

            if (
                result.MatchedCount ==
                0)
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