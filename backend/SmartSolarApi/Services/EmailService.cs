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

        public EmailService(
            IConfiguration config,
            ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// Sends a 6-digit OTP to the user's email address for password reset verification.
        /// The OTP is communicated as valid for five minutes.
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
                "==================================================================");

            _logger.LogInformation(
                "GMAIL OTP VERIFICATION: Preparing OTP for {Email} ({Name})",
                recipientEmail,
                recipientName);

            _logger.LogInformation(
                "OTP CODE: {Otp} (Strictly valid for 5 minutes)",
                otp);

            _logger.LogInformation(
                "==================================================================");

            senderPassword = senderPassword?.Replace(" ", "").Trim();

            if (string.IsNullOrWhiteSpace(senderEmail) ||
                string.IsNullOrWhiteSpace(senderPassword))
            {
                _logger.LogWarning(
                    "EmailSettings credentials not configured in " +
                    "appsettings.json. OTP logged to console above.");

                return true;
            }

            try
            {
                using var client = new SmtpClient(
                    smtpServer,
                    port)
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
                    Subject =
                        $"{otp} is your SØLΛR-X Password Reset Code",

                    Body = BuildHtmlEmailBody(
                        recipientName,
                        otp),

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
                    "Using console fallback.",
                    recipientEmail);

                return true;
            }
        }

        // Constructs an HTML email body containing the OTP
        // and its five-minute expiry warning.
        private static string BuildHtmlEmailBody(
            string recipientName,
            string otp)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <style>
    body {{
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: #0f172a;
      color: #e2e8f0;
      margin: 0;
      padding: 24px;
    }}

    .container {{
      max-width: 540px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.1);
      padding: 36px;
    }}

    .brand {{
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      text-align: center;
      margin-bottom: 24px;
    }}

    .brand span {{
      color: #10b981;
    }}

    .title {{
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }}

    .otp-box {{
      background: linear-gradient(
        135deg,
        rgba(16,185,129,0.15),
        rgba(4,120,87,0.25)
      );

      border: 2px dashed #10b981;
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }}

    .otp-code {{
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 8px;
      color: #34d399;
      font-family: monospace;
    }}

    .warning {{
      background: rgba(239, 68, 68, 0.12);
      border-left: 4px solid #ef4444;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      color: #fca5a5;
      margin-top: 20px;
    }}

    .footer {{
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      margin-top: 28px;
    }}
  </style>
</head>

<body>
  <div class=""container"">

    <div class=""brand"">
      SØLΛR<span>-X</span> MICROGRID
    </div>

    <div class=""title"">
      Password Reset Verification
    </div>

    <p>
      Hello <strong>{WebUtility.HtmlEncode(recipientName)}</strong>,
    </p>

    <p>
      We received a request to reset your password for the
      SØLΛR-X Energy Trading Platform.
      Please use the following 6-digit verification code:
    </p>

    <div class=""otp-box"">
      <div style=""
        font-size: 11px;
        text-transform: uppercase;
        color: #a7f3d0;
        font-weight: 700;
        margin-bottom: 6px;"">
        One-Time Verification Code
      </div>

      <div class=""otp-code"">
        {otp}
      </div>
    </div>

    <div class=""warning"">
      <strong>Important:</strong>
      This verification code expires strictly in
      <strong>5 minutes</strong>.
    </div>

    <div class=""footer"">
      &copy; 2026 SØLΛR-X Smart Solar Microgrid Trading Platform.
      <br/>
      Automated system message. Please do not reply directly.
    </div>

  </div>
</body>
</html>";
        }
    }
}