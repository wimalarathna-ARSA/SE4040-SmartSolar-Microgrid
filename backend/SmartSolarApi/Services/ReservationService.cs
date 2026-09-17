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

        public async Task<(bool Success, string Message)> CancelReservationAsync(string reservationId, string prosumerNic)
        {
            var reservation = await _db.EnergyReservation.Find(r => r.Id == reservationId).FirstOrDefaultAsync();
            if (reservation == null)
            {
                return (false, "Reservation not found.");
            }

            bool isStaff = string.IsNullOrEmpty(prosumerNic);
            if (!isStaff && !reservation.ProsumerNic.Equals(prosumerNic, StringComparison.OrdinalIgnoreCase))
            {
                return (false, "Unauthorized: You do not own this reservation.");
            }

            if (reservation.Status == "Cancelled" || reservation.Status == "Completed")
            {
                return (false, $"Cannot cancel reservation that is already {reservation.Status}.");
            }

            var now = DateTime.UtcNow;
            var noticeTime = reservation.ScheduledDateTime - now;
            if (!isStaff && noticeTime < TimeSpan.FromHours(12))
            {
                return (false, $"Cancellations require at least 12 hours' notice prior to scheduled slot time. Time remaining: {noticeTime.TotalHours:F1} hours.");
            }

            var update = Builders<EnergyReservation>.Update
                .Set(r => r.Status, "Cancelled")
                .Set(r => r.UpdatedAt, now);

            await _db.EnergyReservation.UpdateOneAsync(r => r.Id == reservationId, update);

            return (true, "Reservation cancelled successfully.");
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