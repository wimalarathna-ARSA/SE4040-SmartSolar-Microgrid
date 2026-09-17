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
    }
}