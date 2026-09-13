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
}