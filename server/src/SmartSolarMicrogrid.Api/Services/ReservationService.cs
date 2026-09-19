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

    // =========================================================
    // SRI LANKA TIMEZONE
    // =========================================================

    private static readonly TimeZoneInfo SriLankaTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows()
                ? "Sri Lanka Standard Time"
                : "Asia/Colombo");

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

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
    // TIMEZONE HELPERS
    // =========================================================

    private static DateTime GetSriLankaNow()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.UtcNow,
            SriLankaTimeZone);
    }

    private static DateTime GetSriLankaToday()
    {
        return GetSriLankaNow().Date;
    }

    private static DateTime GetSriLankaDate(DateTime dateTime)
    {
        if (dateTime.Kind == DateTimeKind.Utc)
        {
            return TimeZoneInfo
                .ConvertTimeFromUtc(
                    dateTime,
                    SriLankaTimeZone)
                .Date;
        }

        if (dateTime.Kind == DateTimeKind.Local)
        {
            return TimeZoneInfo
                .ConvertTimeFromUtc(
                    dateTime.ToUniversalTime(),
                    SriLankaTimeZone)
                .Date;
        }

        // DateTimeKind.Unspecified
        // API request dates such as "2026-09-21"
        // are treated as Sri Lanka local dates.
        return dateTime.Date;
    }

    // =========================================================
    // CREATE RESERVATION
    // =========================================================

    public async Task<EnergyReservation> CreateAsync(
        string prosumerNIC,
        CreateReservationDto request)
    {
        // =====================================================
        // CHECK PROSUMER
        // =====================================================

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

        // =====================================================
        // CHECK STATION
        // =====================================================

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

        // =====================================================
        // CHECK SLOT
        // =====================================================

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
        // CHECK SLOT DATE
        // =====================================================

        var slotDateInSriLanka =
            GetSriLankaDate(slot.SlotDate);

        var requestedDateInSriLanka =
            GetSriLankaDate(request.ReservationDate);

        if (slotDateInSriLanka != requestedDateInSriLanka)
        {
            throw new InvalidOperationException(
                "Reservation date must match the selected slot date.");
        }

        // =====================================================
        // 7-DAY BOOKING RULE
        // =====================================================

        var today =
            GetSriLankaToday();

        var maximumDate =
            today.AddDays(7);

        if (requestedDateInSriLanka < today)
        {
            throw new InvalidOperationException(
                "Reservation date cannot be in the past.");
        }

        if (requestedDateInSriLanka > maximumDate)
        {
            throw new InvalidOperationException(
                "Reservation must be within the next 7 days.");
        }

        // =====================================================
        // SAME USER ACTIVE RESERVATION CHECK
        // =====================================================

        var existingForUser =
            await _reservationRepository
                .GetActiveReservationForProsumerAsync(
                    prosumerNIC,
                    request.SlotId,
                    request.ReservationDate);

        if (existingForUser != null)
        {
            if (existingForUser.Status ==
                ReservationStatus.Pending)
            {
                throw new InvalidOperationException(
                    "You have already applied for this date and time. Please wait for the approval or rejection result.");
            }

            if (existingForUser.Status ==
                ReservationStatus.Approved)
            {
                throw new InvalidOperationException(
                    "You already have an approved reservation for this date and time.");
            }
        }

        // =====================================================
        // GLOBAL SLOT RESERVATION CHECK
        // =====================================================

        var existingForSlot =
            await _reservationRepository
                .GetActiveReservationForSlotAsync(
                    request.SlotId,
                    request.ReservationDate);

        if (existingForSlot != null)
        {
            throw new InvalidOperationException(
                "This energy slot is already reserved. Please select another available slot.");
        }

        // =====================================================
        // SLOT CAPACITY CHECK
        // =====================================================

        if (slot.AvailableCapacityKw <= 0)
        {
            throw new InvalidOperationException(
                "Selected slot is full.");
        }

        // =====================================================
        // CREATE RESERVATION
        // =====================================================

        var reservation =
            new EnergyReservation
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
                    requestedDateInSriLanka,

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

    public async Task<List<EnergyReservation>> GetAllAsync()
    {
        return await _reservationRepository
            .GetAllAsync();
    }

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

        // =====================================================
        // ONLY OWNER CAN UPDATE
        // =====================================================

        if (reservation.ProsumerNIC != prosumerNIC)
        {
            throw new UnauthorizedAccessException(
                "You can only update your own reservation.");
        }

        // =====================================================
        // ONLY PENDING RESERVATIONS CAN BE UPDATED
        // =====================================================

        if (reservation.Status !=
            ReservationStatus.Pending)
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

        // =====================================================
        // NEW SLOT MUST BELONG TO SAME STATION
        // =====================================================

        if (slot.StationId != reservation.StationId)
        {
            throw new InvalidOperationException(
                "Slot does not belong to the reservation station.");
        }

        // =====================================================
        // CHECK NEW SLOT DATE
        // =====================================================

        var slotDateInSriLanka =
            GetSriLankaDate(slot.SlotDate);

        var requestedDateInSriLanka =
            GetSriLankaDate(request.ReservationDate);

        if (slotDateInSriLanka != requestedDateInSriLanka)
        {
            throw new InvalidOperationException(
                "Reservation date must match the selected slot date.");
        }

        // =====================================================
        // CHECK NEW RESERVATION DATE
        // =====================================================

        var today =
            GetSriLankaToday();

        var maximumDate =
            today.AddDays(7);

        if (requestedDateInSriLanka < today)
        {
            throw new InvalidOperationException(
                "Reservation date cannot be in the past.");
        }

        if (requestedDateInSriLanka > maximumDate)
        {
            throw new InvalidOperationException(
                "Reservation must be within the next 7 days.");
        }

        // =====================================================
        // CHECK NEW SLOT AVAILABILITY
        // =====================================================

        if (slot.AvailableCapacityKw <= 0)
        {
            throw new InvalidOperationException(
                "Selected slot is full.");
        }

        // =====================================================
        // 12-HOUR RULE
        // =====================================================

        var now =
            GetSriLankaNow();

        var originalReservationDate =
            GetSriLankaDate(
                reservation.ReservationDate);

        var reservationStart =
            originalReservationDate
                .Add(reservation.StartTime);

        var hoursRemaining =
            reservationStart - now;

        if (hoursRemaining.TotalHours < 12)
        {
            throw new InvalidOperationException(
                "Reservation can only be updated at least 12 hours before the scheduled time.");
        }

        // =====================================================
        // CHECK SAME USER ACTIVE RESERVATION
        // =====================================================

        var existingForUser =
            await _reservationRepository
                .GetActiveReservationForProsumerAsync(
                    prosumerNIC,
                    request.SlotId,
                    requestedDateInSriLanka);

        if (existingForUser != null &&
            existingForUser.Id != reservation.Id)
        {
            if (existingForUser.Status ==
                ReservationStatus.Pending)
            {
                throw new InvalidOperationException(
                    "You have already applied for this date and time. Please wait for the approval or rejection result.");
            }

            if (existingForUser.Status ==
                ReservationStatus.Approved)
            {
                throw new InvalidOperationException(
                    "You already have an approved reservation for this date and time.");
            }
        }

        // =====================================================
        // CHECK GLOBAL SLOT RESERVATION
        // =====================================================

        var existingForSlot =
            await _reservationRepository
                .GetActiveReservationForSlotAsync(
                    request.SlotId,
                    requestedDateInSriLanka);

        if (existingForSlot != null &&
            existingForSlot.Id != reservation.Id)
        {
            throw new InvalidOperationException(
                "This energy slot is already reserved. Please select another available slot.");
        }

        // =====================================================
        // UPDATE RESERVATION
        // =====================================================

        reservation.SlotId =
            request.SlotId;

        reservation.ReservationDate =
            requestedDateInSriLanka;

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

        // =====================================================
        // ONLY OWNER CAN CANCEL
        // =====================================================

        if (reservation.ProsumerNIC != prosumerNIC)
        {
            throw new UnauthorizedAccessException(
                "You can only cancel your own reservation.");
        }

        // =====================================================
        // COMPLETED RESERVATION CANNOT BE CANCELLED
        // =====================================================

        if (reservation.Status ==
            ReservationStatus.Completed)
        {
            throw new InvalidOperationException(
                "Completed reservations cannot be cancelled.");
        }

        // =====================================================
        // ALREADY CANCELLED
        // =====================================================

        if (reservation.Status ==
            ReservationStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "Reservation is already cancelled.");
        }

        // =====================================================
        // 12-HOUR RULE
        // =====================================================

        var now =
            GetSriLankaNow();

        var reservationDate =
            GetSriLankaDate(
                reservation.ReservationDate);

        var reservationStart =
            reservationDate
                .Add(reservation.StartTime);

        var hoursRemaining =
            reservationStart - now;

        if (hoursRemaining.TotalHours < 12)
        {
            throw new InvalidOperationException(
                "Reservation can only be cancelled at least 12 hours before the scheduled time.");
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

        if (operatorUser.Role !=
            UserRole.GridOperator)
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

        if (reservation.Status !=
            ReservationStatus.Pending)
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

        if (operatorUser.Role !=
            UserRole.GridOperator)
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

        // =====================================================
        // QR CAN ONLY BE VERIFIED FOR APPROVED RESERVATION
        // =====================================================

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

        if (operatorUser.Role !=
            UserRole.GridOperator)
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

        // =====================================================
        // QR MUST BE VERIFIED FIRST
        // =====================================================

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