using System.ComponentModel.DataAnnotations;

namespace SmartSolarApi.DTOs
{
    public class CreateReservationDto
    {
        public string StationId { get; set; } = string.Empty;
        public DateTime ScheduledDateTime { get; set; }
        public int DurationHours { get; set; } = 1;
        public double EnergyAmountKWh { get; set; }
        public string ReservationType { get; set; } = "DropOff";
    }
}