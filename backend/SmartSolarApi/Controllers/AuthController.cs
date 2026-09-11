using Microsoft.AspNetCore.Mvc;
using SmartSolarApi.DTOs;
using SmartSolarApi.Services;

namespace SmartSolarApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

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
    }
}