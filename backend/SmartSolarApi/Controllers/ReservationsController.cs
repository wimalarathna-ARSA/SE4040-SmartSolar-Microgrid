using Microsoft.AspNetCore.Mvc;
using SmartSolarApi.DTOs;
using SmartSolarApi.Services;

namespace SmartSolarApi.Controllers
{
    /// <summary>
    /// Energy trading reservation endpoints.
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

        /// <summary>
        /// Creates a new energy drop-off / charging slot reservation.
        /// </summary>
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

        /// <summary>
        /// Backoffice officer creates a reservation on behalf of a prosumer.
        /// </summary>
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

        /// <summary>
        /// Retrieves reservations matching query parameters.
        /// </summary>
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

        /// <summary>
        /// Retrieves live dashboard aggregated statistics.
        /// </summary>
        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats([FromQuery] string? prosumerNic)
        {
            var stats = await _reservationService.GetDashboardStatsAsync(prosumerNic);
            return Ok(stats);
        }

        /// <summary>
        /// Retrieves a reservation by ID.
        /// </summary>
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

        /// <summary>
        /// Modifies an existing energy reservation.
        /// </summary>
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

        /// <summary>
        /// Cancels a power trading reservation.
        /// </summary>
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

        /// <summary>
        /// Operator mode: Scans prosumer's transaction QR code and verifies.
        /// </summary>
        [HttpPost("verify-qr")]
        public async Task<IActionResult> VerifyQr([FromQuery] string operatorNic, [FromBody] VerifyQrDto dto)
        {
            if (string.IsNullOrWhiteSpace(operatorNic))
            {
                return BadRequest(new { message = "operatorNic query parameter is required." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _reservationService.VerifyAndCompleteJobAsync(operatorNic, dto);
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
    }
}