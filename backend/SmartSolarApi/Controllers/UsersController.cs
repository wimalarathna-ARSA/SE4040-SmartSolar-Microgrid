// ============================================================================
// File: UsersController.cs
// Author: IT22207418, IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: User management controller for staff and prosumer management.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using Microsoft.AspNetCore.Mvc;
using SmartSolarApi.DTOs;
using SmartSolarApi.Services;

namespace SmartSolarApi.Controllers
{
    /// <summary>
    /// User and Prosumer management endpoints.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserService _userService;

        /// <summary>
        /// Constructor injecting the UserService.
        /// </summary>
        public UsersController(UserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Creates a new staff member (Backoffice or Grid Operator).
        /// POST: api/users/staff
        /// </summary>
        [HttpPost("staff")]
        public async Task<IActionResult> CreateStaff(
            [FromBody] CreateStaffUserDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _userService.CreateStaffUserAsync(dto);

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
                user = result.User
            });
        }

        /// <summary>
        /// Retrieves all registered users with optional role and status filters.
        /// GET: api/users?role=Prosumer&status=Active
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? role,
            [FromQuery] string? status)
        {
            var users = await _userService.GetUsersAsync(role, status);

            return Ok(users);
        }

        /// <summary>
        /// Retrieves pending prosumer registrations.
        /// GET: api/users/pending-prosumers
        /// </summary>
        [HttpGet("pending-prosumers")]
        public async Task<IActionResult> GetPendingProsumers()
        {
            var pending = await _userService.GetPendingProsumersAsync();

            return Ok(pending);
        }

        /// <summary>
        /// Retrieves a user profile by NIC.
        /// GET: api/users/{nic}
        /// </summary>
        [HttpGet("{nic}")]
        public async Task<IActionResult> GetByNic(string nic)
        {
            var user = await _userService.GetUserByNicAsync(nic);

            if (user == null)
            {
                return NotFound(new
                {
                    message = $"User with NIC '{nic}' not found."
                });
            }

            return Ok(user);
        }
    }
}