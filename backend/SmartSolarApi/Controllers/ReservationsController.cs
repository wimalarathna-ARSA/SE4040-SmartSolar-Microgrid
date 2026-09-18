using Microsoft.AspNetCore.Mvc;
using SmartSolarApi.Services;

namespace SmartSolarApi.Controllers
{
    /// <summary>
    /// //////
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]

    public class ReservationsController : ControllerBase
    {
        private readonly ReservationService _reservationService;

        public ReservationsController(ReservationService reservationService)
        {
            _reservationService = reservationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetReservations(
            [FromQuery] string? prosumerNic,
            [FromQuery] string? status,
            [FromQuery] string? stationId,
            [FromQuery] string? search)
        {
            var reservations = await _reservationService.GetReservationsAsync(prosumerNic, status, stationId, search);
            return Ok(reservations);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var reservation = await _reservationService.GetReservationByIdAsync(id);
            if (reservation == null)
            {
                return NotFound(new { message = "Reservation not found." });
            }
            return Ok(reservation);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUserId(string userId)
        {
            var reservations = await _reservationService.GetReservationsAsync(userId, null, null, null);
            return Ok(reservations);
        }

        [HttpGet("station/{stationId}/availability")]
        public async Task<IActionResult> GetStationAvailability(string stationId)
        {
            var reservations = await _reservationService.GetReservationsAsync(null, null, stationId, null);
            return Ok(reservations);
        }
    }

}