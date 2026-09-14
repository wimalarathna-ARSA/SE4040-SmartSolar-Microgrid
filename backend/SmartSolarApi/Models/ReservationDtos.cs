using System.ComponentModel.DataAnnotations;

namespace SmartSolarApi.DTOs
{
    public class CreateReservationDto
    {
        [Required]
        public string StationId { get; set; } = string.Empty;

        public string? SlotId { get; set; }

        public int? SlotNumber { get; set; }

        [Required]
        public DateTime ScheduledDateTime { get; set; }

        [Range(1, 12)]
        public int DurationHours { get; set; } = 1;

        [Required]
        [Range(0.1, 1000.0)]
        public double EnergyAmountKWh { get; set; }

        [Required]
        public string ReservationType { get; set; } = "DropOff";
    }

    public class BackofficeCreateReservationDto
    {
        [Required]
        public string ProsumerNic { get; set; } = string.Empty;

        [Required]
        public string StationId { get; set; } = string.Empty;

        public string? SlotId { get; set; }

        public int? SlotNumber { get; set; }

        [Required]
        public DateTime ScheduledDateTime { get; set; }

        [Range(1, 12)]
        public int DurationHours { get; set; } = 1;

        [Required]
        [Range(0.1, 1000.0)]
        public double EnergyAmountKWh { get; set; }

        [Required]
        public string ReservationType { get; set; } = "DropOff";
    }

    public class UpdateReservationDto
    {
        [Required]
        public DateTime ScheduledDateTime { get; set; }

        [Range(1, 12)]
        public int DurationHours { get; set; } = 1;

        [Required]
        [Range(0.1, 1000.0)]
        public double EnergyAmountKWh { get; set; }

        [Required]
        public string ReservationType { get; set; } = "DropOff";

        public string? StationId { get; set; }

        public string? Status { get; set; }
    }

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

    public class VerifyQrDto
    {
        [Required]
        public string QrCodeData { get; set; } = string.Empty;

        public string? OperatorNotes { get; set; }
    }

    public class DashboardStatsDto
    {
        public int ActiveReservationsCount { get; set; }

        public int PendingReservationsCount { get; set; }

        public int CountOfApprovedFutureReservations { get; set; }

        public int CompletedReservationsCount { get; set; }

        public int TotalStationsCount { get; set; }

        public int TotalProsumersCount { get; set; }
    }
}