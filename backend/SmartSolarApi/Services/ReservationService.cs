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

        public async Task<List<ReservationResponseDto>> GetReservationsAsync(
            string? prosumerNic = null,
            string? status = null,
            string? stationId = null,
            string? search = null)
        {
            var filterBuilder = Builders<EnergyReservation>.Filter;
            var filter = filterBuilder.Empty;

            if (!string.IsNullOrWhiteSpace(prosumerNic))
                filter &= filterBuilder.Eq(r => r.ProsumerNic, prosumerNic);

            if (!string.IsNullOrWhiteSpace(status))
                filter &= filterBuilder.Eq(r => r.Status, status);

            if (!string.IsNullOrWhiteSpace(stationId))
                filter &= filterBuilder.Eq(r => r.StationId, stationId);

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