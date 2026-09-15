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

        public async Task<List<ReservationResponseDto>> GetReservationsAsync()
        {
            var reservations = await _db.EnergyReservation.Find(_ => true)
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