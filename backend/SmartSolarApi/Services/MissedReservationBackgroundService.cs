// ============================================================================
// File: MissedReservationBackgroundService.cs
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Periodic background worker checking for unfinalized reservations
//              past their scheduled date and time, transitioning them to "Missed"
//              status, and releasing their reserved battery slots back to available.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

namespace SmartSolarApi.Services
{
    /// <summary>
    /// Background service that periodically scans for expired reservations and releases their slots.
    /// </summary>
    public class MissedReservationBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MissedReservationBackgroundService> _logger;

        public MissedReservationBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<MissedReservationBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[SmartSolarApi] MissedReservationBackgroundService started.");

            // Poll every 30 seconds
            using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));

            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var reservationService = scope.ServiceProvider.GetRequiredService<ReservationService>();
                    int expired = await reservationService.CheckAndExpireMissedReservationsAsync();
                    if (expired > 0)
                    {
                        _logger.LogInformation("[SmartSolarApi] Automatically transitioned {Count} overdue booking(s) to 'Missed' and released slots.", expired);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[SmartSolarApi] Error in MissedReservationBackgroundService periodic tick.");
                }
            }
        }
    }
}
