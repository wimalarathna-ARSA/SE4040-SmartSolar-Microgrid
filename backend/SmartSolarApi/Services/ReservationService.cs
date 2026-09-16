using System.Security.Cryptography;
using System.Text;
using MongoDB.Driver;
using SmartSolarApi.Data;
using SmartSolarApi.DTOs;
using SmartSolarApi.Models;

namespace SmartSolarApi.Services
{
    public class ReservationService
    {
        private readonly MongoDbContext _db;

        public ReservationService(MongoDbContext db)
        {
            _db = db;
        }

        public async Task<(bool Success, string Message, ReservationResponseDto? Reservation)> CreateReservationAsync(string prosumerNic, CreateReservationDto dto)
        {
            var now = DateTime.UtcNow;

            if (dto.ScheduledDateTime <= now)
            {
                return (false, "Reservation date and time must be in the future.", null);
            }

            var maxAllowedDate = now.AddDays(7);
            if (dto.ScheduledDateTime > maxAllowedDate)
            {
                return (false, $"Power trading reservations must be scheduled within 7 days. Maximum permitted date is {maxAllowedDate:yyyy-MM-dd HH:mm UTC}.", null);
            }

            var prosumer = await _db.UserDetails.Find(u => u.Nic.ToLower() == prosumerNic.Trim().ToLower()).FirstOrDefaultAsync();
            if (prosumer == null || prosumer.Status != "Active")
            {
                return (false, "Prosumer record not found or inactive.", null);
            }

            var station = await _db.SolarStationInfo.Find(s => s.Id == dto.StationId).FirstOrDefaultAsync();
            if (station == null || station.Status != "Active")
            {
                return (false, "Selected station hub is unavailable.", null);
            }

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

            int chosenSlotNumber = 1;
            while (chosenSlotNumber <= station.TotalBatterySlots && occupiedSlotNumbers.Contains(chosenSlotNumber))
            {
                chosenSlotNumber++;
            }

            decimal unitRate = 45.0m;
            decimal totalCost = (decimal)dto.EnergyAmountKWh * unitRate;
            var reservationCode = "RES-" + Random.Shared.Next(100000, 999999);

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
                Status = "Approved",
                CreatedAt = now,
                UpdatedAt = now
            };

            reservation.QrCodeData = GenerateSecureQrPayload(reservation);
            await _db.EnergyReservation.InsertOneAsync(reservation);

            return (true, "Reservation created successfully.", MapToDto(reservation));
        }

        private static string GenerateSecureQrPayload(EnergyReservation res)
        {
            var rawData = $"{res.ReservationCode}:{res.ProsumerNic}:{res.StationId}:{res.ScheduledDateTime:O}";
            using var sha = SHA256.Create();
            var hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(rawData + ":SmartSolarSecretTokenSalt2026"));
            var hash = Convert.ToHexString(hashBytes)[..16];
            return $"SMARTSOLAR-TX|{res.ReservationCode}|{res.ProsumerNic}|{res.StationId}|{hash}";
        }

        public async Task<List<ReservationResponseDto>> GetReservationsAsync(
            string? prosumerNic = null,
            string? status = null,
            string? stationId = null)
        {
            var filterBuilder = Builders<EnergyReservation>.Filter;
            var filter = filterBuilder.Empty;

            if (!string.IsNullOrWhiteSpace(prosumerNic))
                filter &= filterBuilder.Eq(r => r.ProsumerNic, prosumerNic);

            if (!string.IsNullOrWhiteSpace(status))
                filter &= filterBuilder.Eq(r => r.Status, status);

            if (!string.IsNullOrWhiteSpace(stationId))
                filter &= filterBuilder.Eq(r => r.StationId, stationId);

            var reservations = await _db.EnergyReservation.Find(filter)
                .SortByDescending(r => r.ScheduledDateTime)
                .ToListAsync();

            return reservations.Select(MapToDto).ToList();
        }

        public async Task<ReservationResponseDto?> GetReservationByIdAsync(string id)
        {
            var reservation = await _db.EnergyReservation.Find(r => r.Id == id).FirstOrDefaultAsync();
            return reservation == null ? null : MapToDto(reservation);
        }

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