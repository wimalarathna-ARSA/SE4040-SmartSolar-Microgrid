using Microsoft.AspNetCore.Mvc;
using SmartSolarApi.DTOs;
using SmartSolarApi.Services;

namespace SmartSolarApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationsController : ControllerBase
    {
        private readonly ReservationService _reservationService;

        public ReservationsController(ReservationService reservationService)
        {
            _reservationService = reservationService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromQuery] string prosumerNic, [FromBody] CreateReservationDto dto)
        {
            if (string.IsNullOrWhiteSpace(prosumerNic))
            {
                return BadRequest(new { message = "prosumerNic query parameter is required." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _reservationService.CreateReservationAsync(prosumerNic, dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Reservation?.Id }, result.Reservation);
        }

        [HttpPost("backoffice-create")]
        public async Task<IActionResult> BackofficeCreate([FromBody] BackofficeCreateReservationDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createDto = new CreateReservationDto
            {
                StationId = dto.StationId,
                SlotId = dto.SlotId,
                SlotNumber = dto.SlotNumber,
                ScheduledDateTime = dto.ScheduledDateTime,
                DurationHours = dto.DurationHours,
                EnergyAmountKWh = dto.EnergyAmountKWh,
                ReservationType = dto.ReservationType,
            };

            var result = await _reservationService.CreateReservationAsync(dto.ProsumerNic.Trim(), createDto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Reservation?.Id }, new
            {
                message = result.Message,
                reservation = result.Reservation
            });
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

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromQuery] string? prosumerNic, [FromBody] UpdateReservationDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _reservationService.UpdateReservationAsync(id, prosumerNic ?? string.Empty, dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                reservation = result.Reservation
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Cancel(string id, [FromQuery] string? prosumerNic)
        {
            var result = await _reservationService.CancelReservationAsync(id, prosumerNic ?? string.Empty);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }
    }
}