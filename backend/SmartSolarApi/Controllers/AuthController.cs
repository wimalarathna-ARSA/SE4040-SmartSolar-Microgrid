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
    }
}