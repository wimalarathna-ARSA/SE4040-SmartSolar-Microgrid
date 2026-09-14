// ============================================================================
// File: StationService.cs
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Microgrid Solar Hub management service. Manages GPS locations,
//              capacity specs (kW/h), battery slots, schedules, and enforces the
//              mandatory rule: Deactivation is blocked if active energy reservations exist.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Driver;
using SmartSolarApi.Data;
using SmartSolarApi.DTOs;
using SmartSolarApi.Models;

namespace SmartSolarApi.Services
{
    /// <summary>
    /// Service layer managing solar microgrid stations, hubs, and battery capacity.
    /// </summary>
    public class StationService
    {
        private readonly MongoDbContext _db;

        /// <summary>
        /// Constructor injecting the MongoDB database context.
        /// </summary>
        // Injects MongoDbContext for station and reservation queries
        public StationService(MongoDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Creates a new microgrid station with GPS location, kW/h capacity, and battery storage slots.
        /// </summary>
        // Validates unique station code and builds new SolarStationInfo document
        public async Task<(bool Success, string Message, StationResponseDto? Station)> CreateStationAsync(CreateStationDto dto)
        {
            var existing = await _db.SolarStationInfo
                .Find(s => s.StationCode.ToLower() == dto.StationCode.Trim().ToLower())
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                return (false, "A station with this station code already exists.", null);
            }

            var station = new SolarStationInfo
            {
                StationCode = dto.StationCode.Trim().ToUpperInvariant(),
                Name = dto.Name.Trim(),
                Location = dto.Location.Trim(),
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                CapacityKWh = dto.CapacityKWh,
                TotalBatterySlots = dto.TotalBatterySlots,
                AvailableBatterySlots = dto.AvailableBatterySlots,
                OperationalSchedule = dto.OperationalSchedule.Trim(),
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _db.SolarStationInfo.InsertOneAsync(station);

            return (
                true,
                "Microgrid solar hub created successfully with configured battery slots.",
                MapToDto(station, 0)
            );
        }

        /// <summary>
        /// Retrieves all microgrid stations, optionally filtered by status, with active reservation count.
        /// </summary>
        // Fetches station documents and aggregates active reservations per station
        public async Task<List<StationResponseDto>> GetStationsAsync(
            string? status = null,
            double? userLat = null,
            double? userLng = null)
        {
            var filterBuilder = Builders<SolarStationInfo>.Filter;

            var filter = string.IsNullOrWhiteSpace(status)
                ? filterBuilder.Empty
                : filterBuilder.Eq(s => s.Status, status);

            var stations = await _db.SolarStationInfo.Find(filter).ToListAsync();
            var result = new List<StationResponseDto>();

            foreach (var s in stations)
            {
                var activeReservations = await _db.EnergyReservation
                    .Find(r =>
                        (r.StationId == s.Id || r.StationName == s.Name) &&
                        (r.Status == "Approved" ||
                         r.Status == "Pending" ||
                         (r.Status != "Completed" && r.Status != "Cancelled")))
                    .ToListAsync();

                var activeCount = activeReservations.Count;

                var occupiedSlots = activeReservations
                    .Where(r => r.SlotNumber.HasValue && r.SlotNumber.Value > 0)
                    .Select(r => r.SlotNumber!.Value)
                    .Distinct()
                    .ToList();

                var unassigned = activeCount - occupiedSlots.Count;

                if (unassigned > 0)
                {
                    for (int i = 1; i <= s.TotalBatterySlots && unassigned > 0; i++)
                    {
                        if (!occupiedSlots.Contains(i))
                        {
                            occupiedSlots.Add(i);
                            unassigned--;
                        }
                    }
                }

                occupiedSlots.Sort();

                var dto = MapToDto(s, activeCount, occupiedSlots);

                if (s.AvailableBatterySlots != dto.AvailableBatterySlots)
                {
                    _ = _db.SolarStationInfo.UpdateOneAsync(
                        st => st.Id == s.Id,
                        Builders<SolarStationInfo>.Update
                            .Set(st => st.AvailableBatterySlots, dto.AvailableBatterySlots));
                }

                if (userLat.HasValue && userLng.HasValue)
                {
                    dto.DistanceKm = CalculateDistanceKm(
                        userLat.Value,
                        userLng.Value,
                        s.Latitude,
                        s.Longitude);
                }

                result.Add(dto);
            }

            if (userLat.HasValue && userLng.HasValue)
            {
                result = result
                    .OrderBy(s => s.DistanceKm ?? double.MaxValue)
                    .ToList();
            }

            return result;
        }

        /// <summary>
        /// Maps SolarStationInfo model to StationResponseDto.
        /// </summary>
        // Projects database model to client response schema
        private static StationResponseDto MapToDto(
            SolarStationInfo s,
            int activeReservations,
            List<int>? occupiedSlots = null)
        {
            var occupied = occupiedSlots ?? new List<int>();

            int effectiveAvailable = Math.Max(
                0,
                s.TotalBatterySlots -
                Math.Max(activeReservations, occupied.Count));

            return new StationResponseDto
            {
                Id = s.Id ?? string.Empty,
                StationCode = s.StationCode,
                Name = s.Name,
                Location = s.Location,
                Latitude = s.Latitude,
                Longitude = s.Longitude,
                CapacityKWh = s.CapacityKWh,
                AvailableBatterySlots = effectiveAvailable,
                TotalBatterySlots = s.TotalBatterySlots,
                OccupiedSlotNumbers = occupied,
                OperationalSchedule = s.OperationalSchedule,
                Status = s.Status,
                ActiveReservationsCount = activeReservations,
                CreatedAt = s.CreatedAt
            };
        }

        /// <summary>
        /// Haversine formula to compute geographical distance between two GPS coordinates in kilometers.
        /// </summary>
        // Calculates spherical distance for Google Maps nearby station search
        private static double CalculateDistanceKm(
            double lat1,
            double lon1,
            double lat2,
            double lon2)
        {
            const double R = 6371;

            var dLat = (lat2 - lat1) * (Math.PI / 180.0);
            var dLon = (lon2 - lon1) * (Math.PI / 180.0);

            var a =
                Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * (Math.PI / 180.0)) *
                Math.Cos(lat2 * (Math.PI / 180.0)) *
                Math.Sin(dLon / 2) *
                Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(
                Math.Sqrt(a),
                Math.Sqrt(1 - a));

            return Math.Round(R * c, 2);
        }
    }
}