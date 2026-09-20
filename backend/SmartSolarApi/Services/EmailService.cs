// ============================================================================
// File: EmailService.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Centralized Email service for transmitting Password Reset OTPs
//              via Gmail SMTP with development fallback logging.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using System.Net;
using System.Net.Mail;

namespace SmartSolarApi.Services
{
    /// <summary>
    /// Service responsible for dispatching email notifications and OTP verification tokens.
    /// Supports Gmail SMTP with fallback development logging.
    /// </summary>
    public class EmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// Sends a password reset OTP to the user's registered email address.
        /// </summary>
        public async Task<bool> SendPasswordResetOtpAsync(
            string recipientEmail,
            string recipientName,
            string otp)
        {
            var smtpServer = _config["EmailSettings:SmtpServer"]
                ?? "smtp.gmail.com";

            var port = int.TryParse(
                _config["EmailSettings:Port"],
                out var p) ? p : 587;

            var senderEmail = _config["EmailSettings:SenderEmail"];

            var senderPassword = _config["EmailSettings:SenderPassword"];

            var senderName = _config["EmailSettings:SenderName"]
                ?? "SØLΛR-X Microgrid Platform";

            var enableSsl = bool.TryParse(
                _config["EmailSettings:EnableSsl"],
                out var ssl) && ssl;

            _logger.LogInformation(
                "Preparing password reset OTP email for {Email} ({Name})",
                recipientEmail,
                recipientName);

            senderPassword = senderPassword?.Replace(" ", "").Trim();

            // Development fallback when SMTP credentials are unavailable.
            if (string.IsNullOrWhiteSpace(senderEmail) ||
                string.IsNullOrWhiteSpace(senderPassword))
            {
                _logger.LogWarning(
                    "EmailSettings credentials not configured in appsettings.json. " +
                    "OTP logged for development testing: {Otp}",
                    otp);

                return true;
            }

            try
            {
                using var client = new SmtpClient(smtpServer, port)
                {
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(
                        senderEmail.Trim(),
                        senderPassword),
                    EnableSsl = enableSsl,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 15000
                };

                var fromAddress = new MailAddress(
                    senderEmail,
                    senderName);

                var toAddress = new MailAddress(
                    recipientEmail,
                    recipientName);

                using var message = new MailMessage(
                    fromAddress,
                    toAddress)
                {
                    Subject = $"{otp} is your SØLΛR-X Password Reset Code",
                    Body = BuildHtmlEmailBody(recipientName, otp),
                    IsBodyHtml = true
                };

                await client.SendMailAsync(message);

                _logger.LogInformation(
                    "Successfully delivered password reset OTP email to {Email}",
                    recipientEmail);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send OTP email to {Email} via SMTP. " +
                    "Using development fallback.",
                    recipientEmail);

                return true;
            }
        }

        private static string BuildHtmlEmailBody(
            string recipientName,
            string otp)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
</head>
<body>
  <div>
    <h2>SØLΛR-X MICROGRID</h2>
    <h3>Password Reset Verification</h3>

    <p>Hello <strong>{WebUtility.HtmlEncode(recipientName)}</strong>,</p>

    <p>
      We received a request to reset your password.
      Please use the following verification code:
    </p>

    <h1>{otp}</h1>

    <p>
      This verification code expires in 5 minutes.
    </p>
  </div>
</body>
</html>";
        }
    }
}