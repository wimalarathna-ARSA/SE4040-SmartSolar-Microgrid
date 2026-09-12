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
        // Unique station code (e.g. "NODE-001")
        [Required]
        public string StationCode { get; set; } = string.Empty;

        // Station name
        [Required]
        public string Name { get; set; } = string.Empty;

        // Location description or physical address
        [Required]
        public string Location { get; set; } = string.Empty;

        // GPS Latitude coordinate
        [Required]
        public double Latitude { get; set; }

        // GPS Longitude coordinate
        [Required]
        public double Longitude { get; set; }

        // Capacity specifications in kW/h
        [Required]
        [Range(1.0, 10000.0)]
        public double CapacityKWh { get; set; }

        // Total battery storage slots
        [Required]
        [Range(1, 100)]
        public int TotalBatterySlots { get; set; }

        // Available battery storage slots
        [Required]
        public int AvailableBatterySlots { get; set; }

        // Operational weekly schedule
        public string OperationalSchedule { get; set; } = "Mon-Sun 06:00-22:00";
    }

    /// <summary>
    /// Request payload for updating an existing solar microgrid hub.
    /// </summary>
    public class UpdateStationDto
    {
        // Station identifier code (e.g. "HUB-COLOMBO-01")
        public string? StationCode { get; set; }

        // Station name
        [Required]
        public string Name { get; set; } = string.Empty;

        // Location description
        [Required]
        public string Location { get; set; } = string.Empty;

        // GPS Latitude
        [Required]
        public double Latitude { get; set; }

        // GPS Longitude
        [Required]
        public double Longitude { get; set; }

        // Capacity in kW/h
        [Required]
        public double CapacityKWh { get; set; }

        // Total battery slots
        [Required]
        public int TotalBatterySlots { get; set; }

        // Available battery slots
        [Required]
        public int AvailableBatterySlots { get; set; }

        // Operational schedule
        public string OperationalSchedule { get; set; } = string.Empty;

        // Status: "Active" or "Inactive"
        public string Status { get; set; } = "Active";
    }

    /// <summary>
    /// Request payload for Grid Operators to update battery slot availability.
    /// </summary>
    public class UpdateBatterySlotsDto
    {
        // New count of available battery storage slots
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

    /// <summary>
    /// Response payload representing an energy booking time slot.
    /// </summary>
    public class SlotResponseDto
    {
        public string Id { get; set; } = string.Empty;

        public string StationId { get; set; } = string.Empty;

        public string StationName { get; set; } = string.Empty;

        public DateTime SlotStartTime { get; set; }

        public DateTime SlotEndTime { get; set; }

        public double MaxCapacityKWh { get; set; }

        public double AvailableCapacityKWh { get; set; }

        public decimal PricePerKWh { get; set; }

        public string Status { get; set; } = string.Empty;
    }
}