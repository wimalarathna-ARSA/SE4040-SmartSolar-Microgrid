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

        public async Task<(bool Success, string Message, ReservationResponseDto? Reservation)> UpdateReservationAsync(string reservationId, string prosumerNic, UpdateReservationDto dto)
        {
            var reservation = await _db.EnergyReservation.Find(r => r.Id == reservationId).FirstOrDefaultAsync();
            if (reservation == null)
            {
                return (false, "Reservation not found.", null);
            }

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
            var noticeTime = reservation.ScheduledDateTime - now;
            if (!isStaff && noticeTime < TimeSpan.FromHours(12))
            {
                return (false, $"Reservation updates require at least 12 hours' notice prior to scheduled slot time.", null);
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

            reservation.QrCodeData = GenerateSecureQrPayload(reservation);
            update = update.Set(r => r.QrCodeData, reservation.QrCodeData);

            await _db.EnergyReservation.UpdateOneAsync(r => r.Id == reservationId, update);

            return (true, "Reservation updated successfully.", MapToDto(reservation));
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