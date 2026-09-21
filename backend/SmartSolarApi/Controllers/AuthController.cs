// ============================================================================
// File: AuthController.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: API controller managing Prosumer registration, staff login, 
//              credential verification, and JWT issuance.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using Microsoft.AspNetCore.Mvc;
using SmartSolarApi.DTOs;
using SmartSolarApi.Services;

namespace SmartSolarApi.Controllers
{
    /// <summary>
    /// Authentication and user onboarding API endpoints.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        /// <summary>
        /// Constructor injecting the AuthService.
        /// </summary>
        // Injects AuthService dependency for credential operations
        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Registers a new Solar Prosumer using NIC as primary key.
        /// POST: api/auth/register
        /// </summary>
        // Calls AuthService to register prosumer and enforces unique NIC
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterProsumerDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.RegisterProsumerAsync(dto);
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
        /// Authenticates user (Backoffice, Operator, Prosumer) and issues JWT bearer token.
        /// POST: api/auth/login
        /// </summary>
        // Validates credentials and returns JWT token and role redirect information
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.LoginAsync(dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.AuthData);
        }

        /// <summary>
        /// Initiates the Password Reset workflow: generates a 6-digit OTP, sets 5-minute expiry,
        /// and sends it to the user's registered Gmail address.
        /// POST: api/auth/request-password-reset-otp
        /// </summary>
        [HttpPost("request-password-reset-otp")]
        public async Task<IActionResult> RequestPasswordResetOtp([FromBody] RequestPasswordResetOtpDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.RequestPasswordResetOtpAsync(dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                maskedEmail = result.MaskedEmail
            });
        }

        /// <summary>
        /// Verifies that the submitted 6-digit OTP matches and has not expired (within 5 minutes).
        /// POST: api/auth/verify-password-reset-otp
        /// </summary>
        [HttpPost("verify-password-reset-otp")]
        public async Task<IActionResult> VerifyPasswordResetOtp([FromBody] VerifyPasswordResetOtpDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.VerifyPasswordResetOtpAsync(dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }

        /// <summary>
        /// Confirms the password reset with a new password and confirmation.
        /// POST: api/auth/confirm-password-reset
        /// </summary>
        [HttpPost("confirm-password-reset")]
        public async Task<IActionResult> ConfirmPasswordReset([FromBody] ConfirmPasswordResetDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.ConfirmPasswordResetAsync(dto);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }
    }
}