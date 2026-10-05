// ============================================================================
// File: StationsController.cs
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Microgrid Hub Controller. Exposes endpoints for managing solar
//              grid hubs, battery storage slots, and operational schedules.
//              Enforces rule: Deactivation blocked if active reservations exist.
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
        // Injects StationService to manage solar hub operations
        public StationsController(StationService stationService)
        {
            _stationService = stationService;
        }

        /// <summary>
        /// Creates a new microgrid solar hub with GPS coordinates, kW/h capacity, and battery storage slots.
        /// POST: api/stations
        /// </summary>
        // Registers solar station and configures initial battery slot specs
        [HttpPost]
        public async Task<IActionResult> CreateStation([FromBody] CreateStationDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _stationService.CreateStationAsync(dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Station?.Id }, result.Station);
        }

        /// <summary>
        /// Retrieves all microgrid stations. Supports GPS latitude/longitude parameters to return sorted nearby stations.
        /// GET: api/stations?lat=6.9175&lng=79.8654
        /// </summary>
        // Fetches solar stations and computes distance for Google Maps integration
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] double? lat, [FromQuery] double? lng)
        {
            var stations = await _stationService.GetStationsAsync(status, lat, lng);
            return Ok(stations);
        }

        /// <summary>
        /// Retrieves a specific solar microgrid station by its ID.
        /// GET: api/stations/{id}
        /// </summary>
        // Fetches station details and active reservation count
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var station = await _stationService.GetStationByIdAsync(id);
            if (station == null)
            {
                return NotFound(new { message = "Solar station not found." });
            }
            return Ok(station);
        }

        /// <summary>
        /// Updates a microgrid station specs and operational schedule.
        /// PUT: api/stations/{id}
        /// </summary>
        // Modifies station details and enforces active reservation check if setting Inactive
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateStationDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _stationService.UpdateStationAsync(id, dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                station = result.Station
            });
        }

        /// <summary>
        /// Deactivates a microgrid node.
        /// Strictly blocked if active energy reservations exist on this node.
        /// DELETE: api/stations/{id}
        /// </summary>
        // Enforces rule: Station deactivation is blocked if active reservations exist
        [HttpDelete("{id}")]
        public async Task<IActionResult> Deactivate(string id)
        {
            var result = await _stationService.DeactivateStationAsync(id);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }

        /// <summary>
        /// Updates available battery storage slots at a station (Operator feature).
        /// PUT: api/stations/{id}/battery-slots
        /// </summary>
        // Enables Grid Operators to adjust available battery storage slots
        [HttpPut("{id}/battery-slots")]
        public async Task<IActionResult> UpdateBatterySlots(string id, [FromBody] UpdateBatterySlotsDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _stationService.UpdateBatterySlotsAsync(id, dto.AvailableBatterySlots);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }

        /// <summary>
        /// Updates a physical battery slot status (busy or free).
        /// When busy, prosumers cannot book this slot.
        /// PUT/POST: api/stations/{id}/slots/{slotNumber}/busy
        /// </summary>
        [HttpPut("{id}/slots/{slotNumber}/busy")]
        [HttpPost("{id}/slots/{slotNumber}/busy")]
        public async Task<IActionResult> SetSlotBusy(string id, int slotNumber, [FromBody] SetSlotBusyDto? dto)
        {
            bool isBusy = dto?.IsBusy ?? true;
            string? reason = dto?.Reason;
            var result = await _stationService.SetSlotBusyAsync(id, slotNumber, isBusy, reason);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                station = result.Station
            });
        }

        /// <summary>
        /// Releases a slot by clearing busy status or cancelling any active booking on that slot.
        /// POST: api/stations/{id}/slots/{slotNumber}/release
        /// </summary>
        [HttpPost("{id}/slots/{slotNumber}/release")]
        [HttpPut("{id}/slots/{slotNumber}/release")]
        public async Task<IActionResult> ReleaseSlot(string id, int slotNumber)
        {
            var result = await _stationService.ReleaseSlotAsync(id, slotNumber);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                station = result.Station
            });
        }

        /// <summary>
        /// Retrieves available energy booking slots for a given station.
        /// GET: api/stations/{id}/slots
        /// </summary>
        // Lists future time slots for energy drop-off and charging
        [HttpGet("{id}/slots")]
        public async Task<IActionResult> GetSlots(string id)
        {
            var slots = await _stationService.GetSlotsForStationAsync(id);
            return Ok(slots);
        }

        /// <summary>
        /// Returns all active microgrid stations sorted by distance from a prosumer's solar installation GPS.
        /// GET: api/stations/nearby-prosumer/{nic}
        /// </summary>
        // Uses prosumer's stored InstallationLatitude/Longitude to compute Haversine distances
        [HttpGet("nearby-prosumer/{nic}")]
        public async Task<IActionResult> GetNearbyForProsumer(string nic)
        {
            var result = await _stationService.GetNearbyStationsForProsumerAsync(nic);
            if (!result.Success)
            {
                return NotFound(new { message = result.Message });
            }
            return Ok(new
            {
                message = result.Message,
                stations = result.Stations
            });
        }
    }
}