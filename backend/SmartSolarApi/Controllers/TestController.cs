// ============================================================================
// File: TestController.cs
// Author: IT22166210, IT22207418, IT22106292, IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Basic health check endpoint confirming the central API is operational.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using Microsoft.AspNetCore.Mvc;

namespace SmartSolarApi.Controllers
{
    /// <summary>
    /// Health check controller for API responsiveness verification.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        /// <summary>
        /// Simple HTTP GET health check returning API status.
        /// GET: api/test
        /// </summary>
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                status = "Healthy"
            });
        }
    }
}