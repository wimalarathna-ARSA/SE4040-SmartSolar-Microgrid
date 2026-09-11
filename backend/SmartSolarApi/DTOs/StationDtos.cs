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
}