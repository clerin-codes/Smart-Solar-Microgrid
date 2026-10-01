/*
 * File: ReservationRepository.cs
 * Project: Smart Solar Microgrid
 * Description: Persists and queries energy reservations in MongoDB.
 * Author: Clerin - IT23402584
 * Author: Thuverakan - IT23281332
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public class ReservationRepository : IReservationRepository
{
    private readonly IMongoCollection<EnergyReservation> _collection;

    public ReservationRepository(IMongoDatabase database)
    {
        // Responsible: Clerin - IT23402584
        // Resolve the MongoDB reservation collection.
        _collection = database.GetCollection<EnergyReservation>(
            "EnergyReservation");
    }

    public async Task EnsureIndexesAsync()
    {
        // Responsible: Clerin - IT23402584
        // Enforce one active lock per slot/day and unique non-null QR tokens in MongoDB.
        var indexes = new[]
        {
            new CreateIndexModel<EnergyReservation>(
                Builders<EnergyReservation>.IndexKeys.Ascending(x => x.ActiveSlotKey),
                new CreateIndexOptions
                {
                    Name = "ux_reservation_active_slot_key",
                    Unique = true,
                    Sparse = true
                }),
            new CreateIndexModel<EnergyReservation>(
                Builders<EnergyReservation>.IndexKeys.Ascending(x => x.QRToken),
                new CreateIndexOptions<EnergyReservation>
                {
                    Name = "ux_reservation_qr_token",
                    Unique = true,
                    PartialFilterExpression = Builders<EnergyReservation>.Filter.Type(
                        x => x.QRToken,
                        MongoDB.Bson.BsonType.String)
                })
        };

        await _collection.Indexes.CreateManyAsync(indexes);
    }

    // ======================================================
    // Get All Reservations
    // ======================================================

    public async Task<List<EnergyReservation>> GetAllAsync()
    {
        // Responsible: Clerin - IT23402584
        // Return every reservation stored in MongoDB.
        return await _collection
            .Find(_ => true)
            .ToListAsync();
    }


    // ======================================================
    // Get Reservation By ID
    // ======================================================

    public async Task<EnergyReservation?> GetByIdAsync(
        string id)
    {
        // Responsible: Clerin - IT23402584
        // Find a reservation by its MongoDB identifier.
        return await _collection
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();
    }


    // ======================================================
    // Get Reservations By Prosumer NIC
    // ======================================================

    public async Task<List<EnergyReservation>> GetByProsumerAsync(
        string nic)
    {
        // Responsible: Clerin - IT23402584
        // Return all reservations owned by the supplied prosumer NIC.
        return await _collection
            .Find(x => x.ProsumerNIC == nic)
            .ToListAsync();
    }


    // ======================================================
    // Get Active Reservation For Same Prosumer
    // ======================================================

    public async Task<EnergyReservation?>
        GetActiveReservationForProsumerAsync(
            string nic,
            string slotId,
            DateTime reservationDate)
    {
        // Responsible: Clerin - IT23402584
        // Find an active reservation for the prosumer, slot, and calendar day.
        // Start of requested day
        var startOfDay =
            reservationDate.Date;

        // Start of next day
        var startOfNextDay =
            startOfDay.AddDays(1);


        var filter =
            Builders<EnergyReservation>.Filter.And(

                // Same Prosumer
                Builders<EnergyReservation>.Filter.Eq(
                    x => x.ProsumerNIC,
                    nic),

                // Same Slot
                Builders<EnergyReservation>.Filter.Eq(
                    x => x.SlotId,
                    slotId),

                // Reservation date is within requested day
                Builders<EnergyReservation>.Filter.Gte(
                    x => x.ReservationDate,
                    startOfDay),

                Builders<EnergyReservation>.Filter.Lt(
                    x => x.ReservationDate,
                    startOfNextDay),

                // Only Pending and Approved are active
                Builders<EnergyReservation>.Filter.In(
                    x => x.Status,
                    new[]
                    {
                        ReservationStatus.Pending,
                        ReservationStatus.Approved
                    })
            );


        return await _collection
            .Find(filter)
            .FirstOrDefaultAsync();
    }


    // ======================================================
    // Get Active Reservation For Slot
    // ======================================================

    public async Task<EnergyReservation?>
        GetActiveReservationForSlotAsync(
            string slotId,
            DateTime reservationDate)
    {
        // Responsible: Clerin - IT23402584
        // Find an active reservation occupying the slot on the requested day.
        // Start of requested day
        var startOfDay =
            reservationDate.Date;

        // Start of next day
        var startOfNextDay =
            startOfDay.AddDays(1);


        var filter =
            Builders<EnergyReservation>.Filter.And(

                // Same Slot
                Builders<EnergyReservation>.Filter.Eq(
                    x => x.SlotId,
                    slotId),

                // Reservation date is within requested day
                Builders<EnergyReservation>.Filter.Gte(
                    x => x.ReservationDate,
                    startOfDay),

                Builders<EnergyReservation>.Filter.Lt(
                    x => x.ReservationDate,
                    startOfNextDay),

                // Only Pending and Approved are active
                Builders<EnergyReservation>.Filter.In(
                    x => x.Status,
                    new[]
                    {
                        ReservationStatus.Pending,
                        ReservationStatus.Approved
                    })
            );


        return await _collection
            .Find(filter)
            .FirstOrDefaultAsync();
    }


    // ======================================================
    // Check Active Reservation For Station
    // ======================================================

    public async Task<bool> HasActiveReservationForStationAsync(
        string stationId)
    {
        // Responsible: Clerin - IT23402584
        // Determine whether a station has any reservation that is still active.
        var filter =
            Builders<EnergyReservation>.Filter.And(

                // Same Station
                Builders<EnergyReservation>.Filter.Eq(
                    x => x.StationId,
                    stationId),

                // Only active reservations
                Builders<EnergyReservation>.Filter.In(
                    x => x.Status,
                    new[]
                    {
                        ReservationStatus.Pending,
                        ReservationStatus.Approved
                    })
            );


        return await _collection
            .Find(filter)
            .AnyAsync();
    }


    // ======================================================
    // Create Reservation
    // ======================================================

    public async Task CreateAsync(
        EnergyReservation reservation)
    {
        // Responsible: Clerin - IT23402584
        // Insert a new reservation document.
        await _collection.InsertOneAsync(
            reservation);
    }


    // ======================================================
    // Update Reservation
    // ======================================================

    public async Task UpdateAsync(
        EnergyReservation reservation)
    {
        // Responsible: Clerin - IT23402584
        // Replace the stored reservation document with its updated state.
        await _collection.ReplaceOneAsync(
            x => x.Id == reservation.Id,
            reservation);
    }
}
