// ============================================================================
// File: ReservationDtos.cs
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Data Transfer Objects for power trading reservations, QR verification,
//              and operational dashboard statistics.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace SmartSolarApi.DTOs
{
    /// <summary>
    /// Request payload for prosumer to create an energy drop-off / charging reservation.
    /// Strictly checked by API against the 7-day forward window rule.
    /// </summary>
    public class CreateReservationDto
    {
        // Target Station ID
        [Required]
        public string StationId { get; set; } = string.Empty;

        // Optional Slot ID if booking a predetermined slot
        public string? SlotId { get; set; }

        // Specific physical battery slot number selected by user (1..TotalBatterySlots)
        public int? SlotNumber { get; set; }

        // Scheduled reservation date and time
        [Required]
        public DateTime ScheduledDateTime { get; set; }

        // Planned duration in hours (default: 1)
        [Range(1, 12)]
        public int DurationHours { get; set; } = 1;

        // Planned energy amount to trade in kWh
        [Required]
        [Range(0.1, 1000.0)]
        public double EnergyAmountKWh { get; set; }

        // Type: "DropOff" (selling to grid) or "Charging" (buying from grid)
        [Required]
        public string ReservationType { get; set; } = "DropOff";
    }

    /// <summary>
    /// Request payload for Backoffice officer to create a reservation on behalf of a prosumer.
    /// Includes ProsumerNic so the officer specifies which prosumer this reservation belongs to.
    /// The created reservation automatically appears in the prosumer's mobile app.
    /// </summary>
    public class BackofficeCreateReservationDto
    {
        // NIC of the prosumer on whose behalf the reservation is being created
        [Required]
        public string ProsumerNic { get; set; } = string.Empty;

        // Target Station ID
        [Required]
        public string StationId { get; set; } = string.Empty;

        // Optional Slot ID if booking a predetermined slot
        public string? SlotId { get; set; }

        // Specific physical battery slot number selected by officer (1..TotalBatterySlots)
        public int? SlotNumber { get; set; }

        // Scheduled reservation date and time
        [Required]
        public DateTime ScheduledDateTime { get; set; }

        // Planned duration in hours (default: 1)
        [Range(1, 12)]
        public int DurationHours { get; set; } = 1;

        // Planned energy amount to trade in kWh
        [Required]
        [Range(0.1, 1000.0)]
        public double EnergyAmountKWh { get; set; }

        // Type: "DropOff" (selling to grid) or "Charging" (buying from grid)
        [Required]
        public string ReservationType { get; set; } = "DropOff";
    }

    /// <summary>
    /// Request payload for modifying an existing reservation.
    /// Strictly checked by API against the 12-hour cancellation/update policy.
    /// </summary>
    public class UpdateReservationDto
    {
        // Modified date and time (must also satisfy 7-day rule from modification time)
        [Required]
        public DateTime ScheduledDateTime { get; set; }

        // Modified duration in hours
        [Range(1, 12)]
        public int DurationHours { get; set; } = 1;

        // Modified energy amount
        [Required]
        [Range(0.1, 1000.0)]
        public double EnergyAmountKWh { get; set; }

        // Type: "DropOff" or "Charging"
        [Required]
        public string ReservationType { get; set; } = "DropOff";

        // Optional station ID if updating the target hub station
        public string? StationId { get; set; }

        // Optional status update (e.g. "Approved", "Pending", "Cancelled")
        public string? Status { get; set; }
    }

    /// <summary>
    /// Full representation of an energy reservation returned to clients.
    /// </summary>
    public class ReservationResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string ReservationCode { get; set; } = string.Empty;
        public string ProsumerNic { get; set; } = string.Empty;
        public string ProsumerName { get; set; } = string.Empty;
        public string StationId { get; set; } = string.Empty;
        public string StationName { get; set; } = string.Empty;
        public string? SlotId { get; set; }
        public int? SlotNumber { get; set; }
        public DateTime ScheduledDateTime { get; set; }
        public int DurationHours { get; set; }
        public double EnergyAmountKWh { get; set; }
        public decimal TotalCost { get; set; }
        public string ReservationType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string QrCodeData { get; set; } = string.Empty;
        public DateTime? CompletedAt { get; set; }
        public string? OperatorNic { get; set; }
        public string? OperatorNotes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// Request payload for Grid Operator scanning prosumer QR code to finalize job.
    /// </summary>
    public class VerifyQrDto
    {
        // Raw QR code string decoded by scanner
        [Required]
        public string QrCodeData { get; set; } = string.Empty;

        // Optional operator inspection notes
        public string? OperatorNotes { get; set; }
    }

    /// <summary>
    /// Dashboard aggregated counts read live from API for prosumers and operators.
    /// </summary>
    public class DashboardStatsDto
    {
        // Count of reservations currently in Active / Approved state
        public int ActiveReservationsCount { get; set; }

        // Count of reservations awaiting operator / system approval
        public int PendingReservationsCount { get; set; }

        // Count of approved reservations scheduled in future (Rubric requirement)
        public int CountOfApprovedFutureReservations { get; set; }

        // Count of successfully finalized / completed transactions
        public int CompletedReservationsCount { get; set; }

        // Count of operational microgrid hubs
        public int TotalStationsCount { get; set; }

        // Total registered solar prosumers
        public int TotalProsumersCount { get; set; }
    }
}