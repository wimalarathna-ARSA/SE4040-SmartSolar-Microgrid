// ============================================================================
// File: UsersController.cs
// Author: IT22207418, IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: User management controller. Handles staff and prosumer
//              management, profile updates, and account lifecycle operations.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using Microsoft.AspNetCore.Authorization;
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
        /// Retrieves all registered users with optional filters.
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

        /// <summary>
        /// Updates a prosumer profile.
        /// PUT: api/users/{nic}/profile
        /// </summary>
        [HttpPut("{nic}/profile")]
        public async Task<IActionResult> UpdateProfile(
            string nic,
            [FromBody] UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _userService.UpdateProfileAsync(nic, dto);

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
        /// Prosumer requests self-service account deactivation.
        /// PUT: api/users/{nic}/request-deactivation
        /// </summary>
        [HttpPut("{nic}/request-deactivation")]
        public async Task<IActionResult> RequestDeactivation(
            string nic,
            [FromBody] DeactivationRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result =
                await _userService.RequestDeactivationAsync(nic, dto);

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
        /// Activates a pending or newly approved prosumer account.
        /// PUT: api/users/{nic}/activate
        /// </summary>
        [HttpPut("{nic}/activate")]
        public async Task<IActionResult> ActivateProsumer(string nic)
        {
            var result =
                await _userService.ActivateProsumerAsync(nic);

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
        /// Deactivates a prosumer account.
        /// PUT: api/users/{nic}/deactivate
        /// </summary>
        [HttpPut("{nic}/deactivate")]
        public async Task<IActionResult> DeactivateProsumer(
            string nic,
            [FromBody] ChangeAccountStatusDto? dto)
        {
            var result =
                await _userService.DeactivateProsumerAsync(
                    nic,
                    dto?.Note);

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
        /// Reactivates a deactivated prosumer profile.
        /// Only Backoffice officers can perform this operation.
        /// PUT: api/users/{nic}/reactivate
        /// </summary>
        [HttpPut("{nic}/reactivate")]
        [Authorize(Roles = "Backoffice")]
        public async Task<IActionResult> ReactivateProsumer(string nic)
        {
            var result =
                await _userService.ReactivateProsumerAsync(nic);

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
    }
}