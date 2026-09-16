// ============================================================================
// File: AuthController.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: API controller managing Prosumer registration, staff login,
//              credential verification, password recovery, and JWT issuance.
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
        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Registers a new Solar Prosumer using NIC as primary key.
        /// POST: api/auth/register
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register(
            [FromBody] RegisterProsumerDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.RegisterProsumerAsync(dto);

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
        /// Authenticates user and issues JWT bearer token.
        /// POST: api/auth/login
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.LoginAsync(dto);

            if (!result.Success)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(result.AuthData);
        }

        /// <summary>
        /// Requests a password reset OTP.
        /// Generates a 6-digit OTP with a 5-minute expiry.
        /// POST: api/auth/request-password-reset-otp
        /// </summary>
        [HttpPost("request-password-reset-otp")]
        public async Task<IActionResult> RequestPasswordResetOtp(
            [FromBody] RequestPasswordResetOtpDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result =
                await _authService.RequestPasswordResetOtpAsync(dto);

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
                maskedEmail = result.MaskedEmail
            });
        }

        /// <summary>
        /// Verifies the password reset OTP.
        /// POST: api/auth/verify-password-reset-otp
        /// </summary>
        [HttpPost("verify-password-reset-otp")]
        public async Task<IActionResult> VerifyPasswordResetOtp(
            [FromBody] VerifyPasswordResetOtpDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result =
                await _authService.VerifyPasswordResetOtpAsync(dto);

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
        /// Confirms the password reset with a new password.
        /// POST: api/auth/confirm-password-reset
        /// </summary>
        [HttpPost("confirm-password-reset")]
        public async Task<IActionResult> ConfirmPasswordReset(
            [FromBody] ConfirmPasswordResetDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result =
                await _authService.ConfirmPasswordResetAsync(dto);

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