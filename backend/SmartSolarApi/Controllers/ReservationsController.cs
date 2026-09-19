// ============================================================================
// File: ReservationsController.cs
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Energy reservation and power trading controller enforcing:
//              - 7-day advance booking limitation
//              - 12-hour cancellation and modification rule
//              - QR code verification and Operator finalization
//              - Live dashboard counts (pending and approved future counts)
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

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
        /// Strictly enforces: must be scheduled within 7 days.
        /// POST: api/reservations?prosumerNic=199512345678
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
        /// Reuses all business rules (7-day rule, active prosumer, available slots, QR generation).
        /// The resulting reservation immediately appears in the prosumer's mobile app.
        /// POST: api/reservations/backoffice-create
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
        /// Retrieves reservations matching query parameters (search, status, station, prosumer).
        /// GET: api/reservations?prosumerNic=...&status=Approved&search=...
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
        /// Displays pending reservation counts and approved future reservation counts.
        /// GET: api/reservations/dashboard-stats?prosumerNic=...
        /// </summary>
        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats([FromQuery] string? prosumerNic)
        {
            var stats = await _reservationService.GetDashboardStatsAsync(prosumerNic);
            return Ok(stats);
        }

        /// <summary>
        /// Retrieves a reservation by ID.
        /// GET: api/reservations/{id}
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
        /// Strictly enforces: At least 12 hours' notice prior to scheduled slot time.
        /// PUT: api/reservations/{id}?prosumerNic=...
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
        /// Strictly enforces: At least 12 hours' notice prior to scheduled slot time.
        /// DELETE: api/reservations/{id}?prosumerNic=...
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
        /// Operator mode: Scans prosumer's transaction QR code, verifies against server, 
        /// and finalizes energy transfer business logic.
        /// POST: api/reservations/verify-qr?operatorNic=199087654321
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