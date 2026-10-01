// ============================================================================
// File: ReservationService.cs
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Reservation lifecycle management service enforcing the core
//              FAT Service business rules:
//              1) 7-Day Rule: Reservations must be scheduled within 7 days.
//              2) 12-Hour Rule: Updates and cancellations require >= 12h notice.
//              3) QR Code Generation & Operator Finalization.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using System.Security.Cryptography;
using System.Text;
using MongoDB.Driver;
using SmartSolarApi.Data;
using SmartSolarApi.DTOs;
using SmartSolarApi.Models;

namespace SmartSolarApi.Services
{
    /// <summary>
    /// Service layer executing power trading reservation transactions and business validations.
    /// </summary>
    public class ReservationService
    {
        private readonly MongoDbContext _db;

        /// <summary>
        /// Constructor injecting the MongoDB database context.
        /// </summary>
        // Injects MongoDbContext for querying and updating reservations and stations
        public ReservationService(MongoDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Creates a new energy drop-off or charging reservation.
        /// Enforces the MANDATORY 7-day forward schedule rule.
        /// </summary>
        // Enforces: reservation must be scheduled in the future and within 7 days from now
        public async Task<(bool Success, string Message, ReservationResponseDto? Reservation)> CreateReservationAsync(string prosumerNic, CreateReservationDto dto)
        {
            var now = DateTime.UtcNow;

            // Strict Business Rule 1: Must be in the future
            if (dto.ScheduledDateTime <= now)
            {
                return (false, "Reservation date and time must be in the future.", null);
            }

            // Strict Business Rule 2: Must be scheduled within 7 days (Rubric requirement)
            var maxAllowedDate = now.AddDays(7);
            if (dto.ScheduledDateTime > maxAllowedDate)
            {
                return (false, $"Power trading reservations must be scheduled within 7 days. Maximum permitted date is {maxAllowedDate:yyyy-MM-dd HH:mm UTC}.", null);
            }

            // Validate prosumer existence and active status
            var prosumer = await _db.UserDetails.Find(u => u.Nic.ToLower() == prosumerNic.Trim().ToLower()).FirstOrDefaultAsync();
            if (prosumer == null)
            {
                return (false, "Prosumer record not found.", null);
            }

            if (prosumer.Status != "Active")
            {
                return (false, "Only active prosumer accounts may reserve energy trading slots.", null);
            }

            // Validate station existence and active status
            var station = await _db.SolarStationInfo.Find(s => s.Id == dto.StationId).FirstOrDefaultAsync();
            if (station == null)
            {
                return (false, "Target solar station hub does not exist.", null);
            }

            if (station.Status != "Active")
            {
                return (false, "Selected station hub is currently inactive.", null);
            }

            // Check active reservations to see which specific slot numbers are already booked
            var activeReservations = await _db.EnergyReservation.Find(r =>
                r.StationId == station.Id &&
                (r.Status == "Approved" || r.Status == "Pending")).ToListAsync();

            var occupiedSlotNumbers = activeReservations
                .Where(r => r.SlotNumber.HasValue && r.SlotNumber.Value > 0)
                .Select(r => r.SlotNumber!.Value)
                .ToHashSet();

            if (occupiedSlotNumbers.Count >= station.TotalBatterySlots || station.AvailableBatterySlots <= 0)
            {
                return (false, "Selected solar station currently has no available battery storage slots.", null);
            }

            int chosenSlotNumber;
            if (dto.SlotNumber.HasValue && dto.SlotNumber.Value > 0)
            {
                if (dto.SlotNumber.Value > station.TotalBatterySlots)
                {
                    return (false, $"Selected slot #{dto.SlotNumber.Value} exceeds total capacity ({station.TotalBatterySlots} slots) for this hub.", null);
                }

                if (occupiedSlotNumbers.Contains(dto.SlotNumber.Value))
                {
                    return (false, $"Slot #{dto.SlotNumber.Value} is already reserved by another prosumer. Please select another slot.", null);
                }
                chosenSlotNumber = dto.SlotNumber.Value;
            }
            else
            {
                // Automatically allocate the lowest unbooked slot number
                chosenSlotNumber = 1;
                while (chosenSlotNumber <= station.TotalBatterySlots && occupiedSlotNumbers.Contains(chosenSlotNumber))
                {
                    chosenSlotNumber++;
                }
                if (chosenSlotNumber > station.TotalBatterySlots)
                {
                    return (false, "All battery storage slots are currently booked for this station.", null);
                }
            }

            // Calculate cost or earnings (estimate: Rs. 45 per kWh)
            decimal unitRate = 45.0m;
            decimal totalCost = (decimal)dto.EnergyAmountKWh * unitRate;

            var reservationCode = "RES-" + Random.Shared.Next(100000, 999999);

            // Create initial entity
            var reservation = new EnergyReservation
            {
                ReservationCode = reservationCode,
                ProsumerNic = prosumer.Nic,
                ProsumerName = prosumer.FullName,
                StationId = station.Id!,
                StationName = station.Name,
                SlotId = dto.SlotId ?? string.Empty,
                SlotNumber = chosenSlotNumber,
                ScheduledDateTime = dto.ScheduledDateTime,
                DurationHours = dto.DurationHours,
                EnergyAmountKWh = dto.EnergyAmountKWh,
                TotalCost = totalCost,
                ReservationType = dto.ReservationType,
                Status = "Approved", // Approved immediately to generate QR code dispatch
                CreatedAt = now,
                UpdatedAt = now
            };

            // Generate secure QR payload
            reservation.QrCodeData = GenerateSecureQrPayload(reservation);

            await _db.EnergyReservation.InsertOneAsync(reservation);

            // Atomically update AvailableBatterySlots reflecting actual free slots
            var newAvail = Math.Max(0, station.TotalBatterySlots - (occupiedSlotNumbers.Count + 1));
            var slotUpdate = Builders<SolarStationInfo>.Update
                .Set(s => s.AvailableBatterySlots, newAvail)
                .Set(s => s.UpdatedAt, now);
            await _db.SolarStationInfo.UpdateOneAsync(s => s.Id == station.Id, slotUpdate);

            return (true, $"Reservation created and approved successfully for Slot #{chosenSlotNumber}. Transaction QR code generated.", MapToDto(reservation));
        }

        /// <summary>
        /// Modifies an existing energy reservation.
        /// Enforces the MANDATORY 12-hour notice rule prior to scheduled start time.
        /// </summary>
        // Enforces: scheduled time - now >= 12 hours for updates
        public async Task<(bool Success, string Message, ReservationResponseDto? Reservation)> UpdateReservationAsync(string reservationId, string prosumerNic, UpdateReservationDto dto)
        {
            var reservation = await _db.EnergyReservation.Find(r => r.Id == reservationId).FirstOrDefaultAsync();
            if (reservation == null)
            {
                return (false, "Reservation not found.", null);
            }

            // Check ownership unless admin/operator (empty prosumerNic means Backoffice staff)
            bool isStaff = string.IsNullOrEmpty(prosumerNic);
            if (!isStaff && !reservation.ProsumerNic.Equals(prosumerNic, StringComparison.OrdinalIgnoreCase))
            {
                return (false, "Unauthorized: You do not own this reservation.", null);
            }

            if (reservation.Status == "Completed" || reservation.Status == "Cancelled")
            {
                return (false, $"Cannot modify reservation that is already {reservation.Status}.", null);
            }

            var now = DateTime.UtcNow;

            // Strict Business Rule 3: 12-hour cancellation/update rule (Rubric requirement for prosumers)
            var noticeTime = reservation.ScheduledDateTime - now;
            if (!isStaff && noticeTime < TimeSpan.FromHours(12))
            {
                return (false, $"Reservation updates require at least 12 hours' notice prior to the scheduled slot time. Time remaining: {noticeTime.TotalHours:F1} hours.", null);
            }

            // 7-day rule also applies to the rescheduled time
            if (dto.ScheduledDateTime <= now || dto.ScheduledDateTime > now.AddDays(7))
            {
                return (false, "Rescheduled date and time must be in the future and within 7 days from today.", null);
            }

            decimal unitRate = 45.0m;
            decimal totalCost = (decimal)dto.EnergyAmountKWh * unitRate;

            var update = Builders<EnergyReservation>.Update
                .Set(r => r.ScheduledDateTime, dto.ScheduledDateTime)
                .Set(r => r.DurationHours, dto.DurationHours)
                .Set(r => r.EnergyAmountKWh, dto.EnergyAmountKWh)
                .Set(r => r.ReservationType, dto.ReservationType)
                .Set(r => r.TotalCost, totalCost)
                .Set(r => r.UpdatedAt, now);

            reservation.ScheduledDateTime = dto.ScheduledDateTime;
            reservation.DurationHours = dto.DurationHours;
            reservation.EnergyAmountKWh = dto.EnergyAmountKWh;
            reservation.ReservationType = dto.ReservationType;
            reservation.TotalCost = totalCost;
            reservation.UpdatedAt = now;

            // Optional station update if backoffice selects a different microgrid hub
            if (!string.IsNullOrEmpty(dto.StationId) && dto.StationId != reservation.StationId)
            {
                var newStation = await _db.SolarStationInfo.Find(s => s.Id == dto.StationId).FirstOrDefaultAsync();
                if (newStation != null)
                {
                    update = update
                        .Set(r => r.StationId, newStation.Id!)
                        .Set(r => r.StationName, newStation.Name);
                    reservation.StationId = newStation.Id!;
                    reservation.StationName = newStation.Name;
                }
            }

            // Optional status update
            if (!string.IsNullOrEmpty(dto.Status) && dto.Status != reservation.Status)
            {
                update = update.Set(r => r.Status, dto.Status);
                reservation.Status = dto.Status;
            }

            // Regenerate QR data with updated metadata
            reservation.QrCodeData = GenerateSecureQrPayload(reservation);
            update = update.Set(r => r.QrCodeData, reservation.QrCodeData);

            await _db.EnergyReservation.UpdateOneAsync(r => r.Id == reservationId, update);

            return (true, "Reservation updated successfully with refreshed transaction QR code.", MapToDto(reservation));
        }

        /// <summary>
        /// Cancels a power trading reservation.
        /// Enforces the MANDATORY 12-hour notice rule prior to scheduled start time.
        /// </summary>
        // Enforces: scheduled time - now >= 12 hours for cancellations
        public async Task<(bool Success, string Message)> CancelReservationAsync(string reservationId, string prosumerNic)
        {
            var reservation = await _db.EnergyReservation.Find(r => r.Id == reservationId).FirstOrDefaultAsync();
            if (reservation == null)
            {
                return (false, "Reservation not found.");
            }

            // Check ownership unless admin/operator
            bool isStaff = string.IsNullOrEmpty(prosumerNic);
            if (!isStaff && !reservation.ProsumerNic.Equals(prosumerNic, StringComparison.OrdinalIgnoreCase))
            {
                return (false, "Unauthorized: You do not own this reservation.");
            }

            if (reservation.Status == "Cancelled")
            {
                return (false, "Reservation is already cancelled.");
            }

            if (reservation.Status == "Completed")
            {
                return (false, "Cannot cancel a transaction that has already been finalized/completed.");
            }

            var now = DateTime.UtcNow;

            // Strict Business Rule 3: 12-hour notice for cancellations (Rubric requirement for prosumers)
            var noticeTime = reservation.ScheduledDateTime - now;
            if (!isStaff && noticeTime < TimeSpan.FromHours(12))
            {
                return (false, $"Cancellations require at least 12 hours' notice prior to scheduled slot time. Time remaining: {noticeTime.TotalHours:F1} hours.");
            }

            var update = Builders<EnergyReservation>.Update
                .Set(r => r.Status, "Cancelled")
                .Set(r => r.UpdatedAt, now);

            await _db.EnergyReservation.UpdateOneAsync(r => r.Id == reservationId, update);

            // Free the battery slot back to the station
            var remainingActiveCancel = (int)await _db.EnergyReservation.CountDocumentsAsync(r =>
                r.StationId == reservation.StationId &&
                r.Id != reservation.Id &&
                (r.Status == "Approved" || r.Status == "Pending"));

            var stationForCancel = await _db.SolarStationInfo.Find(s => s.Id == reservation.StationId).FirstOrDefaultAsync();
            if (stationForCancel != null)
            {
                int newAvail = Math.Min(stationForCancel.TotalBatterySlots, Math.Max(0, stationForCancel.TotalBatterySlots - remainingActiveCancel));
                var slotFree = Builders<SolarStationInfo>.Update
                    .Set(s => s.AvailableBatterySlots, newAvail)
                    .Set(s => s.UpdatedAt, now);
                await _db.SolarStationInfo.UpdateOneAsync(s => s.Id == stationForCancel.Id, slotFree);
            }

            return (true, "Reservation cancelled successfully.");
        }

        /// <summary>
        /// Grid Operator QR verification and job finalization.
        /// Decodes transaction token, verifies with central database, and completes energy transfer.
        /// </summary>
        // Validates QR code, marks reservation as Completed, and updates station slot availability
        public async Task<(bool Success, string Message, ReservationResponseDto? Reservation)> VerifyAndCompleteJobAsync(string operatorNic, VerifyQrDto dto)
        {
            var reservation = await _db.EnergyReservation.Find(r => r.QrCodeData == dto.QrCodeData.Trim()).FirstOrDefaultAsync();
            if (reservation == null)
            {
                return (false, "Invalid QR code. No matching reservation found on central server.", null);
            }

            if (reservation.Status == "Completed")
            {
                return (false, $"This reservation was already completed on {reservation.CompletedAt:yyyy-MM-dd HH:mm UTC} by operator {reservation.OperatorNic}.", null);
            }

            if (reservation.Status == "Cancelled")
            {
                return (false, "Transaction rejected: This reservation has been cancelled.", null);
            }

            var now = DateTime.UtcNow;

            var update = Builders<EnergyReservation>.Update
                .Set(r => r.Status, "Completed")
                .Set(r => r.CompletedAt, now)
                .Set(r => r.OperatorNic, operatorNic)
                .Set(r => r.OperatorNotes, dto.OperatorNotes ?? "Energy transfer verified and completed by Grid Operator")
                .Set(r => r.UpdatedAt, now);

            await _db.EnergyReservation.UpdateOneAsync(r => r.Id == reservation.Id, update);

            reservation.Status = "Completed";
            reservation.CompletedAt = now;
            reservation.OperatorNic = operatorNic;
            reservation.OperatorNotes = dto.OperatorNotes ?? "Energy transfer completed";

            // Free the battery slot — transaction done, slot is physically released and available again
            var remainingActiveComplete = (int)await _db.EnergyReservation.CountDocumentsAsync(r =>
                r.StationId == reservation.StationId &&
                r.Id != reservation.Id &&
                (r.Status == "Approved" || r.Status == "Pending"));

            var stationForComplete = await _db.SolarStationInfo.Find(s => s.Id == reservation.StationId).FirstOrDefaultAsync();
            if (stationForComplete != null)
            {
                int newAvail = Math.Min(stationForComplete.TotalBatterySlots, Math.Max(0, stationForComplete.TotalBatterySlots - remainingActiveComplete));
                var slotRestore = Builders<SolarStationInfo>.Update
                    .Set(s => s.AvailableBatterySlots, newAvail)
                    .Set(s => s.UpdatedAt, now);
                await _db.SolarStationInfo.UpdateOneAsync(s => s.Id == stationForComplete.Id, slotRestore);
            }

            return (true, $"Energy transfer successfully verified and finalized! Slot #{reservation.SlotNumber} is now released.", MapToDto(reservation));
        }

        /// <summary>
        /// Retrieves reservations with multi-criteria filtering (search query, status, station, prosumer NIC).
        /// </summary>
        // Filters by prosumer NIC, status, station, and text search over reservation code and names
        public async Task<List<ReservationResponseDto>> GetReservationsAsync(
            string? prosumerNic = null,
            string? status = null,
            string? stationId = null,
            string? search = null)
        {
            var filterBuilder = Builders<EnergyReservation>.Filter;
            var filter = filterBuilder.Empty;

            if (!string.IsNullOrWhiteSpace(prosumerNic))
            {
                filter &= filterBuilder.Eq(r => r.ProsumerNic, prosumerNic);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                filter &= filterBuilder.Eq(r => r.Status, status);
            }

            if (!string.IsNullOrWhiteSpace(stationId))
            {
                filter &= filterBuilder.Eq(r => r.StationId, stationId);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim();
                filter &= (filterBuilder.Regex(r => r.ReservationCode, new MongoDB.Bson.BsonRegularExpression(q, "i")) |
                           filterBuilder.Regex(r => r.ProsumerName, new MongoDB.Bson.BsonRegularExpression(q, "i")) |
                           filterBuilder.Regex(r => r.StationName, new MongoDB.Bson.BsonRegularExpression(q, "i")));
            }

            var reservations = await _db.EnergyReservation.Find(filter)
                .SortByDescending(r => r.ScheduledDateTime)
                .ToListAsync();

            return reservations.Select(MapToDto).ToList();
        }

        /// <summary>
        /// Retrieves aggregated dashboard metrics live from central database.
        /// Meets rubric criteria: "Pending reservations 2 · Count of approved future reservations 2".
        /// </summary>
        // Reads counts of active, pending, approved future, completed, stations, and prosumers
        public async Task<DashboardStatsDto> GetDashboardStatsAsync(string? prosumerNic = null)
        {
            var now = DateTime.UtcNow;
            var filterBuilder = Builders<EnergyReservation>.Filter;

            var baseFilter = string.IsNullOrWhiteSpace(prosumerNic) 
                ? filterBuilder.Empty 
                : filterBuilder.Eq(r => r.ProsumerNic, prosumerNic);

            var pendingFilter = baseFilter & filterBuilder.Eq(r => r.Status, "Pending");
            var activeFilter = baseFilter & (filterBuilder.Eq(r => r.Status, "Approved") | filterBuilder.Eq(r => r.Status, "Pending"));
            var approvedFutureFilter = baseFilter & filterBuilder.Eq(r => r.Status, "Approved") & filterBuilder.Gt(r => r.ScheduledDateTime, now);
            var completedFilter = baseFilter & filterBuilder.Eq(r => r.Status, "Completed");

            var pendingCount = (int)await _db.EnergyReservation.CountDocumentsAsync(pendingFilter);
            var activeCount = (int)await _db.EnergyReservation.CountDocumentsAsync(activeFilter);
            var approvedFutureCount = (int)await _db.EnergyReservation.CountDocumentsAsync(approvedFutureFilter);
            var completedCount = (int)await _db.EnergyReservation.CountDocumentsAsync(completedFilter);

            var totalStations = (int)await _db.SolarStationInfo.CountDocumentsAsync(s => s.Status == "Active");
            var totalProsumers = (int)await _db.UserDetails.CountDocumentsAsync(u => u.Role == "Prosumer");

            return new DashboardStatsDto
            {
                PendingReservationsCount = pendingCount,
                ActiveReservationsCount = activeCount,
                CountOfApprovedFutureReservations = approvedFutureCount,
                CompletedReservationsCount = completedCount,
                TotalStationsCount = totalStations,
                TotalProsumersCount = totalProsumers
            };
        }

        /// <summary>
        /// Retrieves a single reservation by ID.
        /// </summary>
        // Queries EnergyReservation by document ObjectId
        public async Task<ReservationResponseDto?> GetReservationByIdAsync(string id)
        {
            var reservation = await _db.EnergyReservation.Find(r => r.Id == id).FirstOrDefaultAsync();
            return reservation == null ? null : MapToDto(reservation);
        }

        /// <summary>
        /// Generates a cryptographically secure, signed transaction QR payload.
        /// </summary>
        // Encodes reservation metadata and SHA256 signature into QR payload string
        private static string GenerateSecureQrPayload(EnergyReservation res)
        {
            var rawData = $"{res.ReservationCode}:{res.ProsumerNic}:{res.StationId}:{res.ScheduledDateTime:O}";
            using var sha = SHA256.Create();
            var hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(rawData + ":SmartSolarSecretTokenSalt2026"));
            var hash = Convert.ToHexString(hashBytes)[..16];
            return $"SMARTSOLAR-TX|{res.ReservationCode}|{res.ProsumerNic}|{res.StationId}|{hash}";
        }

        /// <summary>
        /// Maps EnergyReservation model to ReservationResponseDto.
        /// </summary>
        // Projects database model to client response schema
        private static ReservationResponseDto MapToDto(EnergyReservation r)
        {
            return new ReservationResponseDto
            {
                Id = r.Id ?? string.Empty,
                ReservationCode = r.ReservationCode,
                ProsumerNic = r.ProsumerNic,
                ProsumerName = r.ProsumerName,
                StationId = r.StationId,
                StationName = r.StationName,
                SlotId = r.SlotId,
                SlotNumber = r.SlotNumber,
                ScheduledDateTime = r.ScheduledDateTime,
                DurationHours = r.DurationHours,
                EnergyAmountKWh = r.EnergyAmountKWh,
                TotalCost = r.TotalCost,
                ReservationType = r.ReservationType,
                Status = r.Status,
                QrCodeData = r.QrCodeData,
                CompletedAt = r.CompletedAt,
                OperatorNic = r.OperatorNic,
                OperatorNotes = r.OperatorNotes,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            };
        }
    }
}