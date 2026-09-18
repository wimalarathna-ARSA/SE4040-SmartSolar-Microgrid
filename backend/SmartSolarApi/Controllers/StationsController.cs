// ============================================================================
// File: StationsController.cs
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Microgrid Hub Controller for creating and retrieving solar hubs.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using Microsoft.AspNetCore.Mvc;
using SmartSolarApi.DTOs;
using SmartSolarApi.Services;

namespace SmartSolarApi.Controllers
{
    /// <summary>
    /// Solar Microgrid Station management endpoints.
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

        /// <summary>
        /// Creates a new microgrid solar hub.
        /// POST: api/stations
        /// </summary>
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

        /// <summary>
        /// Retrieves all microgrid stations.
        /// Supports optional status and GPS parameters.
        /// GET: api/stations?lat=6.9175&lng=79.8654
        /// </summary>
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

        /// <summary>
        /// Retrieves a specific solar microgrid station.
        /// GET: api/stations/{id}
        /// </summary>
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
    }
}