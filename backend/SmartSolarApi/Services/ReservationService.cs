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

            return (true, $"Energy transfer successfully verified and finalized!", MapToDto(reservation));
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