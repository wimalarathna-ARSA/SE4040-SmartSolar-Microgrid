// ============================================================================
// File: StationDtos.cs
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Data Transfer Objects for Microgrid Solar Hubs (Nodes) and
//              energy booking slot availability.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace SmartSolarApi.DTOs
{
    /// <summary>
    /// Request payload for creating a new solar microgrid hub.
    /// </summary>
    public class CreateStationDto
    {
        [Required]
        public string StationCode { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Location { get; set; } = string.Empty;

        [Required]
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }

        [Required]
        [Range(1.0, 10000.0)]
        public double CapacityKWh { get; set; }

        [Required]
        [Range(1, 100)]
        public int TotalBatterySlots { get; set; }

        [Required]
        public int AvailableBatterySlots { get; set; }

        public string OperationalSchedule { get; set; } = "Mon-Sun 06:00-22:00";
    }

    /// <summary>
    /// Request payload for updating an existing solar microgrid hub.
    /// </summary>
    public class UpdateStationDto
    {
        public string? StationCode { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Location { get; set; } = string.Empty;

        [Required]
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }

        [Required]
        public double CapacityKWh { get; set; }

        [Required]
        public int TotalBatterySlots { get; set; }

        [Required]
        public int AvailableBatterySlots { get; set; }

        public string OperationalSchedule { get; set; } = string.Empty;

        public string Status { get; set; } = "Active";
    }

    /// <summary>
    /// Request payload for Grid Operators to update battery slot availability.
    /// </summary>
    public class UpdateBatterySlotsDto
    {
        [Required]
        [Range(0, 500)]
        public int AvailableBatterySlots { get; set; }
    }

    /// <summary>
    /// Response payload representing a solar microgrid hub.
    /// </summary>
    public class StationResponseDto
    {
        public string Id { get; set; } = string.Empty;

        public string StationCode { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public double CapacityKWh { get; set; }

        public int AvailableBatterySlots { get; set; }

        public int TotalBatterySlots { get; set; }

        public List<int> OccupiedSlotNumbers { get; set; } = new();

        public string OperationalSchedule { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public int ActiveReservationsCount { get; set; }

        public double? DistanceKm { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}