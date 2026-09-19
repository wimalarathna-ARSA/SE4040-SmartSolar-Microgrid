// ============================================================================
// File: UsersController.cs
// Author: IT22207418, IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: User management controller. Handles staff and prosumer
//              creation, account lifecycle, profile updates, and email
//              update approval workflows.
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

        [HttpGet]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? role,
            [FromQuery] string? status)
        {
            var users = await _userService.GetUsersAsync(role, status);

            return Ok(users);
        }

        [HttpGet("pending-prosumers")]
        public async Task<IActionResult> GetPendingProsumers()
        {
            var pending =
                await _userService.GetPendingProsumersAsync();

            return Ok(pending);
        }

        [HttpGet("{nic}")]
        public async Task<IActionResult> GetByNic(string nic)
        {
            var user =
                await _userService.GetUserByNicAsync(nic);

            if (user == null)
            {
                return NotFound(new
                {
                    message = $"User with NIC '{nic}' not found."
                });
            }

            return Ok(user);
        }

        [HttpPut("{nic}/profile")]
        public async Task<IActionResult> UpdateProfile(
            string nic,
            [FromBody] UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result =
                await _userService.UpdateProfileAsync(nic, dto);

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

        /// <summary>
        /// Prosumer requests permission to update email address.
        /// POST: api/users/{nic}/request-email-update
        /// </summary>
        [HttpPost("{nic}/request-email-update")]
        public async Task<IActionResult> RequestEmailUpdate(
            string nic,
            [FromBody] RequestEmailUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result =
                await _userService.RequestEmailUpdateAsync(nic, dto);

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
        /// Backoffice retrieves pending email update requests.
        /// GET: api/users/email-update-requests
        /// </summary>
        [HttpGet("email-update-requests")]
        public async Task<IActionResult> GetPendingEmailUpdateRequests()
        {
            var requests =
                await _userService.GetPendingEmailUpdateRequestsAsync();

            return Ok(requests);
        }

        /// <summary>
        /// Backoffice reviews an email update request.
        /// PUT: api/users/{nic}/email-update-requests/review
        /// </summary>
        [HttpPut("{nic}/email-update-requests/review")]
        public async Task<IActionResult> ReviewEmailUpdateRequest(
            string nic,
            [FromBody] ReviewEmailUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result =
                await _userService.ReviewEmailUpdateRequestAsync(
                    nic,
                    dto);

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
        /// Backoffice grants or revokes email update access.
        /// PUT: api/users/{nic}/email-update-access
        /// </summary>
        [HttpPut("{nic}/email-update-access")]
        public async Task<IActionResult> SetEmailUpdateAccess(
            string nic,
            [FromBody] ChangeAccountStatusDto dto)
        {
            var grantAccess =
                string.Equals(
                    dto.Status,
                    "Active",
                    StringComparison.OrdinalIgnoreCase) ||
                string.Equals(
                    dto.Status,
                    "Granted",
                    StringComparison.OrdinalIgnoreCase) ||
                string.Equals(
                    dto.Status,
                    "True",
                    StringComparison.OrdinalIgnoreCase);

            var result =
                await _userService.SetEmailUpdateAccessAsync(
                    nic,
                    grantAccess,
                    dto.Note);

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