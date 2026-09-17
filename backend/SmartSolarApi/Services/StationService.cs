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
        public StationService(MongoDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Creates a new microgrid station.
        /// </summary>
        public async Task<(bool Success, string Message, StationResponseDto? Station)> CreateStationAsync(
            CreateStationDto dto)
        {
            var existing = await _db.SolarStationInfo
                .Find(s =>
                    s.StationCode.ToLower() ==
                    dto.StationCode.Trim().ToLower())
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                return (
                    false,
                    "A station with this station code already exists.",
                    null);
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

            await GenerateDefaultSlotsForStationAsync(station);

            return (
                true,
                "Microgrid solar hub created successfully with configured battery slots.",
                MapToDto(station, 0));
        }

        /// <summary>
        /// Retrieves all microgrid stations.
        /// </summary>
        public async Task<List<StationResponseDto>> GetStationsAsync(
            string? status = null,
            double? userLat = null,
            double? userLng = null)
        {
            var filterBuilder =
                Builders<SolarStationInfo>.Filter;

            var filter = string.IsNullOrWhiteSpace(status)
                ? filterBuilder.Empty
                : filterBuilder.Eq(s => s.Status, status);

            var stations = await _db.SolarStationInfo
                .Find(filter)
                .ToListAsync();

            var result = new List<StationResponseDto>();

            foreach (var s in stations)
            {
                var activeReservations =
                    await _db.EnergyReservation
                        .Find(r =>
                            (r.StationId == s.Id ||
                             r.StationName == s.Name) &&
                            (r.Status == "Approved" ||
                             r.Status == "Pending" ||
                             (r.Status != "Completed" &&
                              r.Status != "Cancelled")))
                        .ToListAsync();

                var activeCount =
                    activeReservations.Count;

                var occupiedSlots =
                    activeReservations
                        .Where(r =>
                            r.SlotNumber.HasValue &&
                            r.SlotNumber.Value > 0)
                        .Select(r =>
                            r.SlotNumber!.Value)
                        .Distinct()
                        .ToList();

                var unassigned =
                    activeCount - occupiedSlots.Count;

                if (unassigned > 0)
                {
                    for (
                        int i = 1;
                        i <= s.TotalBatterySlots &&
                        unassigned > 0;
                        i++)
                    {
                        if (!occupiedSlots.Contains(i))
                        {
                            occupiedSlots.Add(i);
                            unassigned--;
                        }
                    }
                }

                occupiedSlots.Sort();

                var dto =
                    MapToDto(
                        s,
                        activeCount,
                        occupiedSlots);

                if (s.AvailableBatterySlots !=
                    dto.AvailableBatterySlots)
                {
                    _ = _db.SolarStationInfo.UpdateOneAsync(
                        st => st.Id == s.Id,
                        Builders<SolarStationInfo>.Update
                            .Set(
                                st => st.AvailableBatterySlots,
                                dto.AvailableBatterySlots));
                }

                if (userLat.HasValue &&
                    userLng.HasValue)
                {
                    dto.DistanceKm =
                        CalculateDistanceKm(
                            userLat.Value,
                            userLng.Value,
                            s.Latitude,
                            s.Longitude);
                }

                result.Add(dto);
            }

            if (userLat.HasValue &&
                userLng.HasValue)
            {
                result = result
                    .OrderBy(s =>
                        s.DistanceKm ??
                        double.MaxValue)
                    .ToList();
            }

            return result;
        }

        /// <summary>
        /// Retrieves a single microgrid station by ID.
        /// </summary>
        public async Task<StationResponseDto?> GetStationByIdAsync(
            string id)
        {
            var station = await _db.SolarStationInfo
                .Find(s => s.Id == id)
                .FirstOrDefaultAsync();

            if (station == null)
                return null;

            var activeReservations =
                await _db.EnergyReservation
                    .Find(r =>
                        (r.StationId == station.Id ||
                         r.StationName == station.Name) &&
                        (r.Status == "Approved" ||
                         r.Status == "Pending" ||
                         (r.Status != "Completed" &&
                          r.Status != "Cancelled")))
                    .ToListAsync();

            var activeCount =
                activeReservations.Count;

            var occupiedSlots =
                activeReservations
                    .Where(r =>
                        r.SlotNumber.HasValue &&
                        r.SlotNumber.Value > 0)
                    .Select(r =>
                        r.SlotNumber!.Value)
                    .Distinct()
                    .ToList();

            var unassigned =
                activeCount - occupiedSlots.Count;

            if (unassigned > 0)
            {
                for (
                    int i = 1;
                    i <= station.TotalBatterySlots &&
                    unassigned > 0;
                    i++)
                {
                    if (!occupiedSlots.Contains(i))
                    {
                        occupiedSlots.Add(i);
                        unassigned--;
                    }
                }
            }

            occupiedSlots.Sort();

            return MapToDto(
                station,
                activeCount,
                occupiedSlots);
        }

        /// <summary>
        /// Updates station details and specifications.
        /// </summary>
        public async Task<(bool Success, string Message, StationResponseDto? Station)> UpdateStationAsync(
            string id,
            UpdateStationDto dto)
        {
            var station = await _db.SolarStationInfo
                .Find(s => s.Id == id)
                .FirstOrDefaultAsync();

            if (station == null)
            {
                return (
                    false,
                    "Microgrid station not found.",
                    null);
            }

            if (dto.AvailableBatterySlots >
                dto.TotalBatterySlots)
            {
                return (
                    false,
                    $"Available battery slots ({dto.AvailableBatterySlots}) cannot exceed total battery slots ({dto.TotalBatterySlots}).",
                    null);
            }

            var newStationCode =
                dto.StationCode?
                    .Trim()
                    .ToUpperInvariant();

            if (!string.IsNullOrEmpty(newStationCode) &&
                !newStationCode.Equals(
                    station.StationCode,
                    StringComparison.OrdinalIgnoreCase))
            {
                var existing =
                    await _db.SolarStationInfo
                        .Find(s =>
                            s.Id != id &&
                            s.StationCode.ToLower() ==
                            newStationCode.ToLower())
                        .FirstOrDefaultAsync();

                if (existing != null)
                {
                    return (
                        false,
                        $"Station code '{newStationCode}' is already in use by another solar hub ({existing.Name}).",
                        null);
                }
            }

            var isAttemptingDeactivation =
                (dto.Status.Equals(
                    "Inactive",
                    StringComparison.OrdinalIgnoreCase) ||
                 dto.Status.Equals(
                    "Deactivated",
                    StringComparison.OrdinalIgnoreCase)) &&
                !station.Status.Equals(
                    "Inactive",
                    StringComparison.OrdinalIgnoreCase);

            if (isAttemptingDeactivation)
            {
                var activeReservations =
                    await _db.EnergyReservation
                        .CountDocumentsAsync(r =>
                            (r.StationId == id ||
                             r.StationId == station.Id ||
                             r.StationName == station.Name) &&
                            (r.Status == "Approved" ||
                             r.Status == "Pending" ||
                             (r.Status != "Completed" &&
                              r.Status != "Cancelled")));

                if (activeReservations > 0)
                {
                    return (
                        false,
                        $"Station deactivation blocked! Cannot deactivate node '{station.Name}' because {activeReservations} active energy reservation(s) currently exist. All active reservations must be completed or cancelled first.",
                        null);
                }
            }

            var update =
                Builders<SolarStationInfo>.Update
                    .Set(
                        s => s.StationCode,
                        string.IsNullOrEmpty(newStationCode)
                            ? station.StationCode
                            : newStationCode)
                    .Set(s => s.Name, dto.Name.Trim())
                    .Set(s => s.Location, dto.Location.Trim())
                    .Set(s => s.Latitude, dto.Latitude)
                    .Set(s => s.Longitude, dto.Longitude)
                    .Set(s => s.CapacityKWh, dto.CapacityKWh)
                    .Set(s => s.TotalBatterySlots, dto.TotalBatterySlots)
                    .Set(s => s.AvailableBatterySlots, dto.AvailableBatterySlots)
                    .Set(
                        s => s.OperationalSchedule,
                        dto.OperationalSchedule.Trim())
                    .Set(s => s.Status, dto.Status)
                    .Set(
                        s => s.UpdatedAt,
                        DateTime.UtcNow);

            await _db.SolarStationInfo
                .UpdateOneAsync(
                    s => s.Id == id,
                    update);

            var updatedStation =
                await _db.SolarStationInfo
                    .Find(s => s.Id == id)
                    .FirstOrDefaultAsync();

            return (
                true,
                "Station specifications, location, capacity and schedule updated successfully.",
                MapToDto(updatedStation!, 0));
        }

        /// <summary>
        /// Deactivates a microgrid node.
        /// </summary>
        public async Task<(bool Success, string Message)> DeactivateStationAsync(
            string id)
        {
            var station =
                await _db.SolarStationInfo
                    .Find(s => s.Id == id)
                    .FirstOrDefaultAsync();

            if (station == null)
            {
                return (
                    false,
                    "Station not found.");
            }

            if (station.Status.Equals(
                    "Inactive",
                    StringComparison.OrdinalIgnoreCase) ||
                station.Status.Equals(
                    "Deactivated",
                    StringComparison.OrdinalIgnoreCase))
            {
                return (
                    false,
                    $"Microgrid station '{station.Name}' is already deactivated.");
            }

            var activeReservations =
                await _db.EnergyReservation
                    .CountDocumentsAsync(r =>
                        (r.StationId == id ||
                         r.StationId == station.Id ||
                         r.StationName == station.Name) &&
                        (r.Status == "Approved" ||
                         r.Status == "Pending" ||
                         (r.Status != "Completed" &&
                          r.Status != "Cancelled")));

            if (activeReservations > 0)
            {
                return (
                    false,
                    $"Station deactivation blocked! Cannot deactivate node '{station.Name}' because {activeReservations} active energy reservation(s) currently exist. All active reservations must be completed or cancelled before this node can be deactivated.");
            }

            var update =
                Builders<SolarStationInfo>.Update
                    .Set(s => s.Status, "Inactive")
                    .Set(
                        s => s.UpdatedAt,
                        DateTime.UtcNow);

            await _db.SolarStationInfo
                .UpdateOneAsync(
                    s => s.Id == id,
                    update);

            return (
                true,
                $"Microgrid station {station.Name} ({station.StationCode}) deactivated successfully.");
        }

        /// <summary>
        /// Updates available battery storage slots.
        /// </summary>
        public async Task<(bool Success, string Message)> UpdateBatterySlotsAsync(
            string id,
            int availableSlots)
        {
            var station =
                await _db.SolarStationInfo
                    .Find(s => s.Id == id)
                    .FirstOrDefaultAsync();

            if (station == null)
            {
                return (
                    false,
                    "Station not found.");
            }

            if (availableSlots >
                station.TotalBatterySlots)
            {
                return (
                    false,
                    $"Available slots cannot exceed total configured slots ({station.TotalBatterySlots}).");
            }

            var update =
                Builders<SolarStationInfo>.Update
                    .Set(
                        s => s.AvailableBatterySlots,
                        availableSlots)
                    .Set(
                        s => s.UpdatedAt,
                        DateTime.UtcNow);

            await _db.SolarStationInfo
                .UpdateOneAsync(
                    s => s.Id == id,
                    update);

            return (
                true,
                $"Battery slots updated to {availableSlots} available slots.");
        }

        /// <summary>
        /// Retrieves future energy booking slots for a station.
        /// </summary>
        public async Task<List<SlotResponseDto>> GetSlotsForStationAsync(
            string stationId)
        {
            var slots =
                await _db.EnergyBookingSlots
                    .Find(s =>
                        s.StationId == stationId &&
                        s.SlotStartTime >= DateTime.UtcNow)
                    .SortBy(s => s.SlotStartTime)
                    .ToListAsync();

            return slots.Select(s =>
                new SlotResponseDto
                {
                    Id = s.Id ?? string.Empty,
                    StationId = s.StationId,
                    StationName = s.StationName,
                    SlotStartTime = s.SlotStartTime,
                    SlotEndTime = s.SlotEndTime,
                    MaxCapacityKWh = s.MaxCapacityKWh,
                    AvailableCapacityKWh =
                        s.AvailableCapacityKWh,
                    PricePerKWh = s.PricePerKWh,
                    Status = s.Status
                }).ToList();
        }

        /// <summary>
        /// Returns active stations sorted by distance from a prosumer's solar installation.
        /// </summary>
        public async Task<(bool Success, string Message, List<StationResponseDto> Stations)> GetNearbyStationsForProsumerAsync(
            string nic)
        {
            var prosumer =
                await _db.UserDetails
                    .Find(u =>
                        u.Nic.ToLower() ==
                        nic.ToLower())
                    .FirstOrDefaultAsync();

            if (prosumer == null)
            {
                return (
                    false,
                    "Prosumer account not found.",
                    new List<StationResponseDto>());
            }

            if (!prosumer.InstallationLatitude.HasValue ||
                !prosumer.InstallationLongitude.HasValue)
            {
                var all =
                    await GetStationsAsync("Active");

                return (
                    true,
                    "No installation coordinates set. Showing all active stations.",
                    all);
            }

            var sorted =
                await GetStationsAsync(
                    "Active",
                    prosumer.InstallationLatitude,
                    prosumer.InstallationLongitude);

            return (
                true,
                $"Nearby microgrid nodes sorted by distance from {prosumer.FullName}'s solar installation.",
                sorted);
        }

        /// <summary>
        /// Generates default energy booking slots for a new station.
        /// </summary>
        private async Task GenerateDefaultSlotsForStationAsync(
            SolarStationInfo station)
        {
            var slots =
                new List<EnergyBookingSlots>();

            for (int day = 0; day < 7; day++)
            {
                var baseDate =
                    DateTime.UtcNow.Date.AddDays(day);

                int[] startHours =
                {
                    8, 10, 12, 14, 16, 18
                };

                foreach (var hour in startHours)
                {
                    slots.Add(
                        new EnergyBookingSlots
                        {
                            StationId = station.Id!,
                            StationName = station.Name,
                            SlotStartTime =
                                baseDate.AddHours(hour),
                            SlotEndTime =
                                baseDate.AddHours(hour + 2),
                            MaxCapacityKWh =
                                station.CapacityKWh / 5.0,
                            AvailableCapacityKWh =
                                station.CapacityKWh / 5.0,
                            PricePerKWh = 45.0m,
                            Status = "Available",
                            CreatedAt =
                                DateTime.UtcNow
                        });
                }
            }

            if (slots.Count > 0)
            {
                await _db.EnergyBookingSlots
                    .InsertManyAsync(slots);
            }
        }

        /// <summary>
        /// Haversine formula to calculate geographical distance in kilometers.
        /// </summary>
        private static double CalculateDistanceKm(
            double lat1,
            double lon1,
            double lat2,
            double lon2)
        {
            const double R = 6371;

            var dLat =
                (lat2 - lat1) *
                (Math.PI / 180.0);

            var dLon =
                (lon2 - lon1) *
                (Math.PI / 180.0);

            var a =
                Math.Sin(dLat / 2) *
                Math.Sin(dLat / 2) +
                Math.Cos(lat1 *
                    (Math.PI / 180.0)) *
                Math.Cos(lat2 *
                    (Math.PI / 180.0)) *
                Math.Sin(dLon / 2) *
                Math.Sin(dLon / 2);

            var c =
                2 *
                Math.Atan2(
                    Math.Sqrt(a),
                    Math.Sqrt(1 - a));

            return Math.Round(R * c, 2);
        }

        /// <summary>
        /// Maps SolarStationInfo model to StationResponseDto.
        /// </summary>
        private static StationResponseDto MapToDto(
            SolarStationInfo s,
            int activeReservations,
            List<int>? occupiedSlots = null)
        {
            var occupied =
                occupiedSlots ??
                new List<int>();

            int effectiveAvailable =
                Math.Max(
                    0,
                    s.TotalBatterySlots -
                    Math.Max(
                        activeReservations,
                        occupied.Count));

            return new StationResponseDto
            {
                Id = s.Id ?? string.Empty,
                StationCode = s.StationCode,
                Name = s.Name,
                Location = s.Location,
                Latitude = s.Latitude,
                Longitude = s.Longitude,
                CapacityKWh = s.CapacityKWh,
                AvailableBatterySlots =
                    effectiveAvailable,
                TotalBatterySlots =
                    s.TotalBatterySlots,
                OccupiedSlotNumbers =
                    occupied,
                OperationalSchedule =
                    s.OperationalSchedule,
                Status = s.Status,
                ActiveReservationsCount =
                    activeReservations,
                CreatedAt = s.CreatedAt
            };
        }
    }
}