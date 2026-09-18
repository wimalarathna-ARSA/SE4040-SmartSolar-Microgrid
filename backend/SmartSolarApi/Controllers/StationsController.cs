// ============================================================================
// File: StationsController.cs
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Microgrid Hub Controller. Manages solar stations, deactivation,
//              and battery storage slots.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using Microsoft.AspNetCore.Mvc;
using SmartSolarApi.DTOs;
using SmartSolarApi.Services;

namespace SmartSolarApi.Controllers
{
    /// <summary>
    /// Solar Microgrid Station and battery slot management endpoints.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class StationsController : ControllerBase
    {
        private readonly StationService _stationService;

        /// <summary>
        /// Constructor injecting StationService.
        /// </summary>
        public StationsController(StationService stationService)
        {
            _stationService = stationService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateStation(
            [FromBody] CreateStationDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result =
                await _stationService.CreateStationAsync(dto);

            if (!result.Success)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return CreatedAtAction(
                nameof(GetById),
                new { id = result.Station?.Id },
                result.Station
            );
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? status,
            [FromQuery] double? lat,
            [FromQuery] double? lng)
        {
            var stations =
                await _stationService.GetStationsAsync(
                    status,
                    lat,
                    lng
                );

            return Ok(stations);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var station =
                await _stationService.GetStationByIdAsync(id);

            if (station == null)
            {
                return NotFound(new
                {
                    message = "Solar station not found."
                });
            }

            return Ok(station);
        }

        /// <summary>
        /// Updates station specifications and operational schedule.
        /// PUT: api/stations/{id}
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] UpdateStationDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result =
                await _stationService.UpdateStationAsync(
                    id,
                    dto
                );

            if (!result.Success)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message,
                station = result.Station
            });
        }

        /// <summary>
        /// Deactivates a microgrid node.
        /// Active reservations are checked by the service layer.
        /// DELETE: api/stations/{id}
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Deactivate(string id)
        {
            var result =
                await _stationService
                    .DeactivateStationAsync(id);

            if (!result.Success)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message
            });
        }

        /// <summary>
        /// Updates available battery storage slots.
        /// PUT: api/stations/{id}/battery-slots
        /// </summary>
        [HttpPut("{id}/battery-slots")]
        public async Task<IActionResult> UpdateBatterySlots(
            string id,
            [FromBody] UpdateBatterySlotsDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result =
                await _stationService.UpdateBatterySlotsAsync(
                    id,
                    dto.AvailableBatterySlots
                );

            if (!result.Success)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message
            });
        }
    }
}