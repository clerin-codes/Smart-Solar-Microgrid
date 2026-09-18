using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public class ReservationRepository : IReservationRepository
{
    private readonly IMongoCollection<EnergyReservation> _collection;

    public ReservationRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<EnergyReservation>(
            "EnergyReservation");
    }

    // ======================================================
    // Get All Reservations
    // ======================================================

    public async Task<List<EnergyReservation>> GetAllAsync()
    {
        return await _collection
            .Find(_ => true)
            .ToListAsync();
    }


    // ======================================================
    // Get Reservation By ID
    // ======================================================

    public async Task<EnergyReservation?> GetByIdAsync(string id)
    {
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
        return await _collection
            .Find(x => x.ProsumerNIC == nic)
            .ToListAsync();
    }


    // ======================================================
    // Check Duplicate Reservation
    // ======================================================

    public async Task<bool> HasDuplicateReservationAsync(
        string nic,
        string slotId,
        DateTime reservationDate)
    {
        // Start of the requested day
        var startOfDay =
            reservationDate.Date;

        // Start of the next day
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


                // Reservation date is within the requested day
                Builders<EnergyReservation>.Filter.Gte(
                    x => x.ReservationDate,
                    startOfDay),

                Builders<EnergyReservation>.Filter.Lt(
                    x => x.ReservationDate,
                    startOfNextDay),


                // Only active reservations count as duplicates
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
    // Check Active Reservation For Station
    // ======================================================

    public async Task<bool> HasActiveReservationForStationAsync(
        string stationId)
    {
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
        await _collection.InsertOneAsync(
            reservation);
    }


    // ======================================================
    // Update Reservation
    // ======================================================

    public async Task UpdateAsync(
        EnergyReservation reservation)
    {
        await _collection.ReplaceOneAsync(
            x => x.Id == reservation.Id,
            reservation);
    }
}