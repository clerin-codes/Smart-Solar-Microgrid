using System.Security.Cryptography;
using SmartSolarMicrogrid.Api.DTOs.Reservations;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IStationRepository _stationRepository;
    private readonly ISlotRepository _slotRepository;
    private readonly IUserRepository _userRepository;

    public ReservationService(
        IReservationRepository reservationRepository,
        IStationRepository stationRepository,
        ISlotRepository slotRepository,
        IUserRepository userRepository)
    {
        _reservationRepository = reservationRepository;
        _stationRepository = stationRepository;
        _slotRepository = slotRepository;
        _userRepository = userRepository;
    }

    // =========================================================
    // CREATE RESERVATION
    // =========================================================

    public async Task<EnergyReservation> CreateAsync(
        string prosumerNIC,
        CreateReservationDto request)
    {
        // Check Prosumer
        var user =
            await _userRepository.GetByNICAsync(
                prosumerNIC);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "Prosumer not found.");
        }

        if (!user.IsActive)
        {
            throw new InvalidOperationException(
                "Prosumer account is inactive.");
        }

        if (user.Role != UserRole.Prosumer)
        {
            throw new UnauthorizedAccessException(
                "Only Prosumer users can create reservations.");
        }

        // Check Station
        var station =
            await _stationRepository.GetByIdAsync(
                request.StationId);

        if (station == null)
        {
            throw new KeyNotFoundException(
                "Station not found.");
        }

        if (!station.IsActive)
        {
            throw new InvalidOperationException(
                "Station is inactive.");
        }

        // Check Slot
        var slot =
            await _slotRepository.GetByIdAsync(
                request.SlotId);

        if (slot == null)
        {
            throw new KeyNotFoundException(
                "Slot not found.");
        }

        if (slot.StationId != request.StationId)
        {
            throw new InvalidOperationException(
                "Slot does not belong to the selected station.");
        }

        // =====================================================
        // 7-DAY BOOKING RULE
        // =====================================================

        var today = DateTime.UtcNow.Date;
        var maximumDate = today.AddDays(7);

        // Prevent past reservations
        if (request.ReservationDate.Date < today)
        {
            throw new InvalidOperationException(
                "Reservation date cannot be in the past.");
        }

        // Prevent reservations more than 7 days ahead
        if (request.ReservationDate.Date > maximumDate)
        {
            throw new InvalidOperationException(
                "Reservation must be within the next 7 days.");
        }

        // =====================================================
        // DUPLICATE RESERVATION CHECK
        // =====================================================

        var duplicate =
            await _reservationRepository
                .HasDuplicateReservationAsync(
                    prosumerNIC,
                    request.SlotId,
                    request.ReservationDate);

        if (duplicate)
        {
            throw new InvalidOperationException(
                "You already have a reservation for this slot.");
        }

        // =====================================================
        // SLOT AVAILABILITY
        // =====================================================

        if (slot.AvailableCapacityKw <= 0)
        {
            throw new InvalidOperationException(
                "Selected slot is full.");
        }

        // =====================================================
        // CREATE RESERVATION
        // =====================================================

        var reservation = new EnergyReservation
        {
            ReservationNumber =
                GenerateReservationNumber(),

            ProsumerNIC =
                prosumerNIC,

            StationId =
                request.StationId,

            SlotId =
                request.SlotId,

            ReservationDate =
                request.ReservationDate.Date,

            StartTime =
                slot.StartTime,

            EndTime =
                slot.EndTime,

            Status =
                ReservationStatus.Pending,

            TransactionStatus =
                TransactionStatus.NotStarted,

            CreatedAt =
                DateTime.UtcNow,

            UpdatedAt =
                DateTime.UtcNow
        };

        await _reservationRepository
            .CreateAsync(reservation);

        return reservation;
    }


    // =========================================================
    // GET RESERVATION BY ID
    // =========================================================

    public async Task<EnergyReservation?> GetByIdAsync(
        string id)
    {
        return await _reservationRepository
            .GetByIdAsync(id);
    }


    // =========================================================
    // GET MY RESERVATIONS
    // =========================================================

    public async Task<List<EnergyReservation>>
        GetMyReservationsAsync(
            string prosumerNIC)
    {
        return await _reservationRepository
            .GetByProsumerAsync(prosumerNIC);
    }


    // =========================================================
    // UPDATE RESERVATION
    // =========================================================

    public async Task<EnergyReservation> UpdateAsync(
        string prosumerNIC,
        string reservationId,
        UpdateReservationDto request)
    {
        // Find reservation
        var reservation =
            await _reservationRepository
                .GetByIdAsync(reservationId);

        if (reservation == null)
        {
            throw new KeyNotFoundException(
                "Reservation not found.");
        }

        // Only owner can update
        if (reservation.ProsumerNIC != prosumerNIC)
        {
            throw new UnauthorizedAccessException(
                "You can only update your own reservation.");
        }

        // =====================================================
        // 12-HOUR RULE
        // =====================================================

        var reservationStart =
            reservation.ReservationDate.Date
                .Add(reservation.StartTime);

        var hoursRemaining =
            reservationStart - DateTime.UtcNow;

        if (hoursRemaining.TotalHours < 12)
        {
            throw new InvalidOperationException(
                "Reservation can only be updated at least 12 hours before the scheduled time.");
        }

        // Only Pending reservations can be updated
        if (reservation.Status != ReservationStatus.Pending)
        {
            throw new InvalidOperationException(
                "Only pending reservations can be updated.");
        }

        // =====================================================
        // CHECK NEW SLOT
        // =====================================================

        var slot =
            await _slotRepository
                .GetByIdAsync(request.SlotId);

        if (slot == null)
        {
            throw new KeyNotFoundException(
                "Slot not found.");
        }

        // New slot must belong to same station
        if (slot.StationId != reservation.StationId)
        {
            throw new InvalidOperationException(
                "Slot does not belong to the reservation station.");
        }

        // New slot must have capacity
        if (slot.AvailableCapacityKw <= 0)
        {
            throw new InvalidOperationException(
                "Selected slot is full.");
        }

        // =====================================================
        // UPDATE RESERVATION
        // =====================================================

        reservation.SlotId =
            request.SlotId;

        reservation.ReservationDate =
            request.ReservationDate.Date;

        reservation.StartTime =
            slot.StartTime;

        reservation.EndTime =
            slot.EndTime;

        reservation.UpdatedAt =
            DateTime.UtcNow;

        await _reservationRepository
            .UpdateAsync(reservation);

        return reservation;
    }


    // =========================================================
    // CANCEL RESERVATION
    // =========================================================

    public async Task CancelAsync(
        string prosumerNIC,
        string reservationId)
    {
        var reservation =
            await _reservationRepository
                .GetByIdAsync(reservationId);

        if (reservation == null)
        {
            throw new KeyNotFoundException(
                "Reservation not found.");
        }

        // Only owner can cancel
        if (reservation.ProsumerNIC != prosumerNIC)
        {
            throw new UnauthorizedAccessException(
                "You can only cancel your own reservation.");
        }

        // =====================================================
        // 12-HOUR RULE
        // =====================================================

        var reservationStart =
            reservation.ReservationDate.Date
                .Add(reservation.StartTime);

        var hoursRemaining =
            reservationStart - DateTime.UtcNow;

        if (hoursRemaining.TotalHours < 12)
        {
            throw new InvalidOperationException(
                "Reservation can only be cancelled at least 12 hours before the scheduled time.");
        }

        // Completed reservation cannot be cancelled
        if (reservation.Status == ReservationStatus.Completed)
        {
            throw new InvalidOperationException(
                "Completed reservations cannot be cancelled.");
        }

        // Already cancelled
        if (reservation.Status == ReservationStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "Reservation is already cancelled.");
        }

        // =====================================================
        // CANCEL
        // =====================================================

        reservation.Status =
            ReservationStatus.Cancelled;

        reservation.UpdatedAt =
            DateTime.UtcNow;

        await _reservationRepository
            .UpdateAsync(reservation);
    }


    // =========================================================
    // APPROVE RESERVATION
    // =========================================================

    public async Task<EnergyReservation> ApproveAsync(
        string operatorNIC,
        string reservationId)
    {
        // =====================================================
        // CHECK OPERATOR
        // =====================================================

        var operatorUser =
            await _userRepository
                .GetByNICAsync(operatorNIC);

        if (operatorUser == null)
        {
            throw new KeyNotFoundException(
                "Operator not found.");
        }

        if (!operatorUser.IsActive)
        {
            throw new UnauthorizedAccessException(
                "Operator account is inactive.");
        }

        if (operatorUser.Role != UserRole.GridOperator)
        {
            throw new UnauthorizedAccessException(
                "Only Grid Operators can approve reservations.");
        }

        // =====================================================
        // FIND RESERVATION
        // =====================================================

        var reservation =
            await _reservationRepository
                .GetByIdAsync(reservationId);

        if (reservation == null)
        {
            throw new KeyNotFoundException(
                "Reservation not found.");
        }

        if (reservation.Status != ReservationStatus.Pending)
        {
            throw new InvalidOperationException(
                "Only pending reservations can be approved.");
        }

        // =====================================================
        // APPROVE
        // =====================================================

        reservation.Status =
            ReservationStatus.Approved;

        reservation.ApprovedBy =
            operatorNIC;

        reservation.QRToken =
            GenerateSecureQRToken();

        reservation.QRGeneratedAt =
            DateTime.UtcNow;

        reservation.UpdatedAt =
            DateTime.UtcNow;

        await _reservationRepository
            .UpdateAsync(reservation);

        return reservation;
    }


    // =========================================================
    // VERIFY QR
    // =========================================================

    public async Task<EnergyReservation> VerifyQRAsync(
        string operatorNIC,
        string qrToken)
    {
        // =====================================================
        // CHECK OPERATOR
        // =====================================================

        var operatorUser =
            await _userRepository
                .GetByNICAsync(operatorNIC);

        if (operatorUser == null)
        {
            throw new KeyNotFoundException(
                "Operator not found.");
        }

        if (!operatorUser.IsActive)
        {
            throw new UnauthorizedAccessException(
                "Operator account is inactive.");
        }

        if (operatorUser.Role != UserRole.GridOperator)
        {
            throw new UnauthorizedAccessException(
                "Only Grid Operators can verify QR codes.");
        }

        // =====================================================
        // FIND QR
        // =====================================================

        var reservations =
            await _reservationRepository
                .GetAllAsync();

        var reservation =
            reservations.FirstOrDefault(
                x => x.QRToken == qrToken);

        if (reservation == null)
        {
            throw new KeyNotFoundException(
                "Invalid QR token.");
        }

        // QR can only be verified for Approved reservation
        if (reservation.Status !=
            ReservationStatus.Approved)
        {
            throw new InvalidOperationException(
                "Reservation is not approved.");
        }

        // =====================================================
        // VERIFY TRANSACTION
        // =====================================================

        reservation.TransactionStatus =
            TransactionStatus.Verified;

        reservation.UpdatedAt =
            DateTime.UtcNow;

        await _reservationRepository
            .UpdateAsync(reservation);

        return reservation;
    }


    // =========================================================
    // COMPLETE RESERVATION
    // =========================================================

    public async Task<EnergyReservation> CompleteAsync(
        string operatorNIC,
        string reservationId)
    {
        // =====================================================
        // CHECK OPERATOR
        // =====================================================

        var operatorUser =
            await _userRepository
                .GetByNICAsync(operatorNIC);

        if (operatorUser == null)
        {
            throw new KeyNotFoundException(
                "Operator not found.");
        }

        if (!operatorUser.IsActive)
        {
            throw new UnauthorizedAccessException(
                "Operator account is inactive.");
        }

        if (operatorUser.Role != UserRole.GridOperator)
        {
            throw new UnauthorizedAccessException(
                "Only Grid Operators can complete reservations.");
        }

        // =====================================================
        // FIND RESERVATION
        // =====================================================

        var reservation =
            await _reservationRepository
                .GetByIdAsync(reservationId);

        if (reservation == null)
        {
            throw new KeyNotFoundException(
                "Reservation not found.");
        }

        // QR must be verified first
        if (reservation.TransactionStatus !=
            TransactionStatus.Verified)
        {
            throw new InvalidOperationException(
                "Reservation QR must be verified before completion.");
        }

        // =====================================================
        // COMPLETE
        // =====================================================

        reservation.Status =
            ReservationStatus.Completed;

        reservation.TransactionStatus =
            TransactionStatus.Completed;

        reservation.CompletedBy =
            operatorNIC;

        reservation.CompletedAt =
            DateTime.UtcNow;

        reservation.UpdatedAt =
            DateTime.UtcNow;

        await _reservationRepository
            .UpdateAsync(reservation);

        return reservation;
    }


    // =========================================================
    // GENERATE RESERVATION NUMBER
    // =========================================================

    private static string GenerateReservationNumber()
    {
        return
            $"RES-{DateTime.UtcNow:yyyyMMddHHmmss}-{RandomNumberGenerator.GetInt32(1000, 9999)}";
    }


    // =========================================================
    // GENERATE SECURE QR TOKEN
    // =========================================================

    private static string GenerateSecureQRToken()
    {
        var bytes =
            RandomNumberGenerator.GetBytes(32);

        return Convert.ToBase64String(bytes);
    }
}