// ============================================================================
// File: UsersController.cs
// Author: IT22207418, IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: User management controller. Handles Backoffice/Grid Operator 
//              creation, pending prosumer activations, profile updates, 
//              and prosumer deactivation/reactivation.
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
        // Injects UserService to handle user administrative and lifecycle operations
        public UsersController(UserService userService)
        {
            // Assign injected UserService to local field
            _userService = userService;
        }

        /// <summary>
        /// Creates a new staff member (Backoffice or Grid Operator).
        /// POST: api/users/staff
        /// </summary>
        // Restricts staff onboarding to Backoffice administrators
        [HttpPost("staff")]
        public async Task<IActionResult> CreateStaff([FromBody] CreateStaffUserDto dto)
        {
            // Validate staff creation model and create new operator/backoffice account
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _userService.CreateStaffUserAsync(dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
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
        // Queries system users matching supplied filters
        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] string? role, [FromQuery] string? status)
        {
            // Query MongoDB for user records matching the supplied role and status query parameters
            var users = await _userService.GetUsersAsync(role, status);
            return Ok(users);
        }

        /// <summary>
        /// Retrieves pending prosumer registrations awaiting Backoffice activation.
        /// GET: api/users/pending-prosumers
        /// </summary>
        // Returns list of newly registered prosumers in PendingApproval status
        [HttpGet("pending-prosumers")]
        public async Task<IActionResult> GetPendingProsumers()
        {
            // Retrieve prosumers currently awaiting administrator approval
            var pending = await _userService.GetPendingProsumersAsync();
            return Ok(pending);
        }

        /// <summary>
        /// Retrieves a user profile by their National Identity Card (NIC).
        /// GET: api/users/{nic}
        /// </summary>
        // Locates specific user by primary business key NIC
        [HttpGet("{nic}")]
        public async Task<IActionResult> GetByNic(string nic)
        {
            // Lookup user profile by primary identity key NIC
            var user = await _userService.GetUserByNicAsync(nic);
            if (user == null)
            {
                return NotFound(new { message = $"User with NIC '{nic}' not found." });
            }
            return Ok(user);
        }

        /// <summary>
        /// Updates a prosumer profile (name, phone, address).
        /// PUT: api/users/{nic}/profile
        /// </summary>
        // Enables prosumers to update personal contact and installation details
        [HttpPut("{nic}/profile")]
        public async Task<IActionResult> UpdateProfile(string nic, [FromBody] UpdateProfileDto dto)
        {
            // Validate profile model and update contact and location details in database
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _userService.UpdateProfileAsync(nic, dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
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
        // Records deactivation request and reason for Backoffice review
        [HttpPut("{nic}/request-deactivation")]
        public async Task<IActionResult> RequestDeactivation(string nic, [FromBody] DeactivationRequestDto dto)
        {
            // Validate deactivation request payload and record self-service deactivation request
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _userService.RequestDeactivationAsync(nic, dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }

        /// <summary>
        /// Backoffice officer activates a pending or newly approved prosumer account.
        /// PUT: api/users/{nic}/activate
        /// </summary>
        // Marks prosumer account as Active in system
        [HttpPut("{nic}/activate")]
        public async Task<IActionResult> ActivateProsumer(string nic)
        {
            // Transition prosumer account status to Active and clear deactivation flags
            var result = await _userService.ActivateProsumerAsync(nic);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                user = result.User
            });
        }

        /// <summary>
        /// Backoffice officer deactivates a prosumer account.
        /// PUT: api/users/{nic}/deactivate
        /// </summary>
        // Sets prosumer status to Deactivated
        [HttpPut("{nic}/deactivate")]
        public async Task<IActionResult> DeactivateProsumer(string nic, [FromBody] ChangeAccountStatusDto? dto)
        {
            // Deactivate prosumer account and record optional administrator audit note
            var result = await _userService.DeactivateProsumerAsync(nic, dto?.Note);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                user = result.User
            });
        }

        /// <summary>
        /// Reactivates a deactivated prosumer profile.
        /// Strictly enforced: Deactivated accounts can ONLY be reactivated by a Backoffice officer.
        /// PUT: api/users/{nic}/reactivate
        /// </summary>
        // Enforces Backoffice authority to restore deactivated prosumer accounts
        [HttpPut("{nic}/reactivate")]
        [Authorize(Roles = "Backoffice")]
        public async Task<IActionResult> ReactivateProsumer(string nic)
        {
            // Reactivate prosumer profile and restore full trading permissions
            var result = await _userService.ReactivateProsumerAsync(nic);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                user = result.User
            });
        }

        /// <summary>
        /// Prosumer requests access from Backoffice to update their email address.
        /// POST: api/users/{nic}/request-email-update
        /// </summary>
        [HttpPost("{nic}/request-email-update")]
        public async Task<IActionResult> RequestEmailUpdate(string nic, [FromBody] RequestEmailUpdateDto dto)
        {
            // Verify model state and log prosumer email change request for administrator review
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _userService.RequestEmailUpdateAsync(nic, dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                user = result.User
            });
        }

        /// <summary>
        /// Backoffice retrieves all pending email update requests.
        /// GET: api/users/email-update-requests
        /// </summary>
        [HttpGet("email-update-requests")]
        public async Task<IActionResult> GetPendingEmailUpdateRequests()
        {
            // Fetch list of all prosumer email update requests currently in Pending status
            var requests = await _userService.GetPendingEmailUpdateRequestsAsync();
            return Ok(requests);
        }

        /// <summary>
        /// Backoffice reviews (Accepts or Denies) an email update request and grants or denies access.
        /// PUT: api/users/{nic}/email-update-requests/review
        /// </summary>
        [HttpPut("{nic}/email-update-requests/review")]
        public async Task<IActionResult> ReviewEmailUpdateRequest(string nic, [FromBody] ReviewEmailUpdateDto dto)
        {
            // Validate review decision and update prosumer email update permission flags
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _userService.ReviewEmailUpdateRequestAsync(nic, dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                user = result.User
            });
        }

        /// <summary>
        /// Backoffice directly grants or revokes email change access for a prosumer.
        /// PUT: api/users/{nic}/email-update-access
        /// </summary>
        [HttpPut("{nic}/email-update-access")]
        public async Task<IActionResult> SetEmailUpdateAccess(string nic, [FromBody] ChangeAccountStatusDto dto)
        {
            // Parse status flag and configure direct email update access permissions
            var grantAccess = string.Equals(dto.Status, "Active", StringComparison.OrdinalIgnoreCase) ||
                              string.Equals(dto.Status, "Granted", StringComparison.OrdinalIgnoreCase) ||
                              string.Equals(dto.Status, "True", StringComparison.OrdinalIgnoreCase);

            var result = await _userService.SetEmailUpdateAccessAsync(nic, grantAccess, dto.Note);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                user = result.User
            });
        }

        /// <summary>
        /// Prosumer executes the email address update once Backoffice has granted access.
        /// Strictly enforces:
        /// - EmailUpdateAccessGranted == true
        /// - Maximum 3 updates within 24 hours. If exceeded, returns 'try later'.
        /// PUT: api/users/{nic}/update-email
        /// </summary>
        [HttpPut("{nic}/update-email")]
        public async Task<IActionResult> UpdateEmail(string nic, [FromBody] ExecuteEmailUpdateDto dto)
        {
            // Verify model state and execute prosumer email change with 24h rate limit enforcement
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _userService.UpdateEmailAsync(nic, dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                user = result.User
            });
        }
    }
}