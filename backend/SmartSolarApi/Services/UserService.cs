// ============================================================================
// File: UserService.cs
// Author: IT22207418, IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: User and Prosumer management service. Enforces Backoffice authority
//              for creating staff, activating/reactivating prosumers by NIC, 
//              and prosumer profile editing.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Driver;
using SmartSolarApi.Data;
using SmartSolarApi.DTOs;
using SmartSolarApi.Models;

namespace SmartSolarApi.Services
{
    /// <summary>
    /// Service layer handling user administration, role assignment, and prosumer lifecycle.
    /// </summary>
    public class UserService
    {
        private readonly MongoDbContext _db;

        /// <summary>
        /// Constructor injecting the MongoDB context.
        /// </summary>
        // Injects MongoDbContext for UserDetails collection operations
        public UserService(MongoDbContext db)
        {
            // Injects MongoDbContext dependency for user administration operations
            _db = db;
        }

        /// <summary>
        /// Creates a new Backoffice or Grid Operator staff member (restricted to Backoffice).
        /// </summary>
        // Validates staff role, uniqueness of NIC and email, and persists hashed credentials
        public async Task<(bool Success, string Message, UserResponseDto? User)> CreateStaffUserAsync(CreateStaffUserDto dto)
        {
            // Validate staff role, enforce unique NIC and email, hash password, and persist new staff account
            if (dto.Role != "Backoffice" && dto.Role != "GridOperator")
            {
                return (false, "Invalid staff role specified. Allowed values are 'Backoffice' and 'GridOperator'.", null);
            }

            var existingNic = await _db.UserDetails.Find(u => u.Nic.ToLower() == dto.Nic.Trim().ToLower()).FirstOrDefaultAsync();
            if (existingNic != null)
            {
                return (false, "A user with this NIC already exists.", null);
            }

            var existingEmail = await _db.UserDetails.Find(u => u.Email.ToLower() == dto.Email.Trim().ToLower()).FirstOrDefaultAsync();
            if (existingEmail != null)
            {
                return (false, "A user with this email address already exists.", null);
            }

            var staff = new UserDetails
            {
                Nic = dto.Nic.Trim().ToUpperInvariant(),
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim().ToLowerInvariant(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role,
                PhoneNumber = dto.PhoneNumber.Trim(),
                Address = dto.Address.Trim(),
                Status = "Active", // Staff created by Backoffice is automatically active
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _db.UserDetails.InsertOneAsync(staff);

            return (true, $"{dto.Role} user created successfully.", MapToDto(staff));
        }

        /// <summary>
        /// Retrieves list of users with optional filtering by role and status.
        /// </summary>
        // Builds Mongo filter query and maps to UserResponseDto collection
        public async Task<List<UserResponseDto>> GetUsersAsync(string? role = null, string? status = null)
        {
            // Build dynamic MongoDB filter by role and status, then project to response DTOs
            var filterBuilder = Builders<UserDetails>.Filter;
            var filter = filterBuilder.Empty;

            if (!string.IsNullOrWhiteSpace(role))
            {
                filter &= filterBuilder.Eq(u => u.Role, role);
            }
            if (!string.IsNullOrWhiteSpace(status))
            {
                filter &= filterBuilder.Eq(u => u.Status, status);
            }

            var users = await _db.UserDetails.Find(filter).SortByDescending(u => u.CreatedAt).ToListAsync();
            return users.Select(MapToDto).ToList();
        }

        /// <summary>
        /// Retrieves pending prosumer registrations awaiting Backoffice activation.
        /// </summary>
        // Queries UserDetails collection for Role == 'Prosumer' and Status == 'PendingApproval'
        public async Task<List<UserResponseDto>> GetPendingProsumersAsync()
        {
            // Filter prosumer accounts awaiting Backoffice activation approval
            var filter = Builders<UserDetails>.Filter.Eq(u => u.Role, "Prosumer") &
                         Builders<UserDetails>.Filter.Eq(u => u.Status, "PendingApproval");

            var users = await _db.UserDetails.Find(filter).SortByDescending(u => u.CreatedAt).ToListAsync();
            return users.Select(MapToDto).ToList();
        }

        /// <summary>
        /// Retrieves user profile details by NIC.
        /// </summary>
        // Finds user matching National Identity Card primary key
        public async Task<UserResponseDto?> GetUserByNicAsync(string nic)
        {
            // Locate user account by National Identity Card number and project to response DTO
            var user = await _db.UserDetails.Find(u => u.Nic.ToLower() == nic.Trim().ToLower()).FirstOrDefaultAsync();
            return user == null ? null : MapToDto(user);
        }

        /// <summary>
        /// Activates a pending or deactivated prosumer account (Backoffice officer only).
        /// </summary>
        // Updates user status to 'Active' and clears deactivation flags
        public async Task<(bool Success, string Message, UserResponseDto? User)> ActivateProsumerAsync(string nic)
        {
            // Set prosumer account status to Active and clear any deactivation request flags
            var user = await _db.UserDetails.Find(u => u.Nic.ToLower() == nic.Trim().ToLower()).FirstOrDefaultAsync();
            if (user == null)
            {
                return (false, "User not found with specified NIC.", null);
            }

            var update = Builders<UserDetails>.Update
                .Set(u => u.Status, "Active")
                .Set(u => u.DeactivationRequested, false)
                .Set(u => u.DeactivationReason, null)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);
            user.Status = "Active";
            user.DeactivationRequested = false;
            user.DeactivationReason = null;

            return (true, $"Prosumer account {nic} activated successfully.", MapToDto(user));
        }

        /// <summary>
        /// Deactivates a prosumer profile. Deactivated accounts can only be reactivated by a Backoffice officer.
        /// </summary>
        // Sets account status to 'Deactivated'
        public async Task<(bool Success, string Message, UserResponseDto? User)> DeactivateProsumerAsync(string nic, string? reason = null)
        {
            // Set prosumer account status to Deactivated with reason and restrict reactivation to Backoffice
            var user = await _db.UserDetails.Find(u => u.Nic.ToLower() == nic.Trim().ToLower()).FirstOrDefaultAsync();
            if (user == null)
            {
                return (false, "User not found with specified NIC.", null);
            }

            var update = Builders<UserDetails>.Update
                .Set(u => u.Status, "Deactivated")
                .Set(u => u.DeactivationRequested, false)
                .Set(u => u.DeactivationReason, reason ?? "Deactivated by Backoffice Officer")
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);
            user.Status = "Deactivated";
            user.DeactivationRequested = false;
            user.DeactivationReason = reason;

            return (true, $"Prosumer {nic} has been deactivated. Only a Backoffice officer can reactivate it.", MapToDto(user));
        }

        /// <summary>
        /// Reactivates a deactivated prosumer profile (Backoffice officer only).
        /// </summary>
        // Strict rubric rule: Deactivated accounts can only be reactivated by a Backoffice officer
        public async Task<(bool Success, string Message, UserResponseDto? User)> ReactivateProsumerAsync(string nic)
        {
            // Verify account is deactivated, then restore to Active status (Backoffice authority only)
            var user = await _db.UserDetails.Find(u => u.Nic.ToLower() == nic.Trim().ToLower()).FirstOrDefaultAsync();
            if (user == null)
            {
                return (false, "User not found with specified NIC.", null);
            }

            if (user.Status != "Deactivated")
            {
                return (false, $"Account is not currently deactivated (Current status: {user.Status}).", null);
            }

            var update = Builders<UserDetails>.Update
                .Set(u => u.Status, "Active")
                .Set(u => u.DeactivationRequested, false)
                .Set(u => u.DeactivationReason, null)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);
            user.Status = "Active";

            return (true, $"Prosumer account {nic} reactivated by Backoffice officer.", MapToDto(user));
        }

        /// <summary>
        /// Prosumer self-service profile modification.
        /// </summary>
        // Modifies contact details and the solar installation map coordinates
        public async Task<(bool Success, string Message, UserResponseDto? User)> UpdateProfileAsync(string nic, UpdateProfileDto dto)
        {
            // Update prosumer contact and address fields in database
            var user = await _db.UserDetails.Find(u => u.Nic.ToLower() == nic.Trim().ToLower()).FirstOrDefaultAsync();
            if (user == null)
            {
                return (false, "User not found.", null);
            }

            var update = Builders<UserDetails>.Update
                .Set(u => u.FullName, dto.FullName.Trim())
                .Set(u => u.PhoneNumber, dto.PhoneNumber.Trim())
                .Set(u => u.Address, dto.Address.Trim())
                .Set(u => u.InstallationLatitude, dto.InstallationLatitude)
                .Set(u => u.InstallationLongitude, dto.InstallationLongitude)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);
            user.FullName = dto.FullName.Trim();
            user.PhoneNumber = dto.PhoneNumber.Trim();
            user.Address = dto.Address.Trim();
            user.InstallationLatitude = dto.InstallationLatitude;
            user.InstallationLongitude = dto.InstallationLongitude;

            return (true, "Profile updated successfully.", MapToDto(user));
        }

        /// <summary>
        /// Prosumer self-service account deactivation request.
        /// </summary>
        // Flags account with deactivation request for Backoffice review
        public async Task<(bool Success, string Message)> RequestDeactivationAsync(string nic, DeactivationRequestDto dto)
        {
            // Flag prosumer account with pending deactivation reason for Backoffice review
            var user = await _db.UserDetails.Find(u => u.Nic.ToLower() == nic.Trim().ToLower()).FirstOrDefaultAsync();
            if (user == null)
            {
                return (false, "User not found.");
            }

            var update = Builders<UserDetails>.Update
                .Set(u => u.DeactivationRequested, true)
                .Set(u => u.DeactivationReason, dto.Reason.Trim())
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);

            return (true, "Deactivation request submitted successfully. A Backoffice officer will review your request.");
        }

        /// <summary>
        /// Prosumer submits a request to Backoffice to update their email address.
        /// </summary>
        public async Task<(bool Success, string Message, UserResponseDto? User)> RequestEmailUpdateAsync(string nic, RequestEmailUpdateDto dto)
        {
            // Validate 24-hour update rate limit and register pending email modification request
            var user = await _db.UserDetails.Find(u => u.Nic.ToLower() == nic.Trim().ToLower()).FirstOrDefaultAsync();
            if (user == null)
            {
                return (false, "User not found with specified NIC.", null);
            }

            if (user.Status != "Active")
            {
                return (false, $"Account is not active (Current status: {user.Status}).", null);
            }

            // 24-hour rate limit check: maximum 3 updates in 24 hours
            var updatesIn24h = GetUpdatesInLast24Hours(user);
            if (updatesIn24h >= 3)
            {
                return (false, "Email can only be updated 3 times within 24 hours. Please try later.", null);
            }

            if (user.EmailUpdateRequestStatus == "Pending")
            {
                return (false, "You already have an email update request pending Backoffice review.", null);
            }

            if (!string.IsNullOrWhiteSpace(dto.RequestedNewEmail))
            {
                var requestedEmail = dto.RequestedNewEmail.Trim().ToLowerInvariant();
                if (requestedEmail == user.Email.ToLowerInvariant())
                {
                    return (false, "The requested email is already your current registered email.", null);
                }

                var existing = await _db.UserDetails.Find(u => u.Email.ToLower() == requestedEmail && u.Nic != user.Nic).FirstOrDefaultAsync();
                if (existing != null)
                {
                    return (false, "A user with this email address already exists in the system.", null);
                }
            }

            var update = Builders<UserDetails>.Update
                .Set(u => u.EmailUpdateRequestStatus, "Pending")
                .Set(u => u.RequestedNewEmail, string.IsNullOrWhiteSpace(dto.RequestedNewEmail) ? null : dto.RequestedNewEmail.Trim().ToLowerInvariant())
                .Set(u => u.EmailUpdateRequestReason, dto.Reason?.Trim())
                .Set(u => u.EmailUpdateRequestDate, DateTime.UtcNow)
                .Set(u => u.EmailUpdateAccessGranted, false)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);
            user.EmailUpdateRequestStatus = "Pending";
            user.RequestedNewEmail = string.IsNullOrWhiteSpace(dto.RequestedNewEmail) ? null : dto.RequestedNewEmail.Trim().ToLowerInvariant();
            user.EmailUpdateRequestReason = dto.Reason?.Trim();
            user.EmailUpdateRequestDate = DateTime.UtcNow;
            user.EmailUpdateAccessGranted = false;

            return (true, "Email update request submitted successfully. A Backoffice officer will review your request and grant access.", MapToDto(user));
        }

        /// <summary>
        /// Retrieves all pending email update requests awaiting Backoffice review.
        /// </summary>
        public async Task<List<EmailUpdateRequestSummaryDto>> GetPendingEmailUpdateRequestsAsync()
        {
            // Retrieve all pending email change requests awaiting Backoffice action
            var filter = Builders<UserDetails>.Filter.Eq(u => u.EmailUpdateRequestStatus, "Pending");
            var users = await _db.UserDetails.Find(filter).SortByDescending(u => u.EmailUpdateRequestDate).ToListAsync();

            return users.Select(u =>
            {
                var updates = GetUpdatesInLast24Hours(u);
                return new EmailUpdateRequestSummaryDto
                {
                    Nic = u.Nic,
                    FullName = u.FullName,
                    CurrentEmail = u.Email,
                    RequestedNewEmail = u.RequestedNewEmail,
                    Reason = u.EmailUpdateRequestReason,
                    RequestDate = u.EmailUpdateRequestDate,
                    Status = u.EmailUpdateRequestStatus,
                    AccessGranted = u.EmailUpdateAccessGranted,
                    ReviewNotes = u.EmailUpdateReviewNotes,
                    UpdatesLast24Hours = updates,
                    UpdatesRemaining24Hours = Math.Max(0, 3 - updates)
                };
            }).ToList();
        }

        /// <summary>
        /// Backoffice reviews (Accept or Deny) a prosumer's email update request.
        /// If accepted, grants access to the prosumer to change their email.
        /// </summary>
        public async Task<(bool Success, string Message, UserResponseDto? User)> ReviewEmailUpdateRequestAsync(string nic, ReviewEmailUpdateDto dto)
        {
            // Process Backoffice decision to accept or deny prosumer email update request
            var user = await _db.UserDetails.Find(u => u.Nic.ToLower() == nic.Trim().ToLower()).FirstOrDefaultAsync();
            if (user == null)
            {
                return (false, "User not found with specified NIC.", null);
            }

            var isAccept = string.Equals(dto.Action, "Accept", StringComparison.OrdinalIgnoreCase);
            var isDeny = string.Equals(dto.Action, "Deny", StringComparison.OrdinalIgnoreCase);

            if (!isAccept && !isDeny)
            {
                return (false, "Invalid action. Allowed actions are 'Accept' and 'Deny'.", null);
            }

            if (isAccept)
            {
                // Verify rate limit: if user has already made 3 updates in the last 24h
                var updates = GetUpdatesInLast24Hours(user);
                if (updates >= 3)
                {
                    return (false, "Cannot grant access: Prosumer has already updated their email 3 times within 24 hours. Please try later.", null);
                }

                var update = Builders<UserDetails>.Update
                    .Set(u => u.EmailUpdateAccessGranted, true)
                    .Set(u => u.EmailUpdateRequestStatus, "Approved")
                    .Set(u => u.EmailUpdateReviewNotes, dto.Note?.Trim() ?? "Approved by Backoffice Officer")
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);

                await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);
                user.EmailUpdateAccessGranted = true;
                user.EmailUpdateRequestStatus = "Approved";
                user.EmailUpdateReviewNotes = dto.Note?.Trim() ?? "Approved by Backoffice Officer";

                return (true, $"Email update request accepted. Access granted to prosumer {user.Nic} to update email.", MapToDto(user));
            }
            else
            {
                var update = Builders<UserDetails>.Update
                    .Set(u => u.EmailUpdateAccessGranted, false)
                    .Set(u => u.EmailUpdateRequestStatus, "Denied")
                    .Set(u => u.EmailUpdateReviewNotes, dto.Note?.Trim() ?? "Denied by Backoffice Officer")
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);

                await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);
                user.EmailUpdateAccessGranted = false;
                user.EmailUpdateRequestStatus = "Denied";
                user.EmailUpdateReviewNotes = dto.Note?.Trim() ?? "Denied by Backoffice Officer";

                return (true, $"Email update request denied for prosumer {user.Nic}.", MapToDto(user));
            }
        }

        /// <summary>
        /// Directly grants or revokes email update access for a prosumer (Backoffice authority).
        /// </summary>
        public async Task<(bool Success, string Message, UserResponseDto? User)> SetEmailUpdateAccessAsync(string nic, bool grantAccess, string? note = null)
        {
            // Directly grant or revoke single-use permission for prosumer to change email
            var user = await _db.UserDetails.Find(u => u.Nic.ToLower() == nic.Trim().ToLower()).FirstOrDefaultAsync();
            if (user == null)
            {
                return (false, "User not found with specified NIC.", null);
            }

            if (grantAccess)
            {
                var updates = GetUpdatesInLast24Hours(user);
                if (updates >= 3)
                {
                    return (false, "Cannot grant access: Prosumer has already updated their email 3 times within 24 hours. Please try later.", null);
                }
            }

            var update = Builders<UserDetails>.Update
                .Set(u => u.EmailUpdateAccessGranted, grantAccess)
                .Set(u => u.EmailUpdateRequestStatus, grantAccess ? "Approved" : "None")
                .Set(u => u.EmailUpdateReviewNotes, note ?? (grantAccess ? "Directly granted by Backoffice" : "Access revoked by Backoffice"))
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);
            user.EmailUpdateAccessGranted = grantAccess;
            user.EmailUpdateRequestStatus = grantAccess ? "Approved" : "None";
            user.EmailUpdateReviewNotes = note;

            return (true, grantAccess ? $"Email update access granted to prosumer {user.Nic}." : $"Email update access revoked for prosumer {user.Nic}.", MapToDto(user));
        }

        /// <summary>
        /// Prosumer executes the email address update once Backoffice has granted access.
        /// Strictly enforces:
        /// 1. Must have EmailUpdateAccessGranted == true
        /// 2. 24-hour rate limit: Maximum 3 updates within 24 hours. If exceeded, returns 'try later'.
        /// 3. Consumes the access flag upon successful update.
        /// </summary>
        public async Task<(bool Success, string Message, UserResponseDto? User)> UpdateEmailAsync(string nic, ExecuteEmailUpdateDto dto)
        {
            // Enforce Backoffice permission, verify 24-hour rate limit, and update user email
            var user = await _db.UserDetails.Find(u => u.Nic.ToLower() == nic.Trim().ToLower()).FirstOrDefaultAsync();
            if (user == null)
            {
                return (false, "User not found with specified NIC.", null);
            }

            if (user.Status != "Active")
            {
                return (false, $"Account is not active (Current status: {user.Status}).", null);
            }

            // Rate limit check: strictly max 3 updates within 24 hours
            var updatesIn24h = GetUpdatesInLast24Hours(user);
            if (updatesIn24h >= 3)
            {
                return (false, "Email can only be updated 3 times within 24 hours. Please try later.", null);
            }

            // Access permission check: Backoffice must have granted access
            if (!user.EmailUpdateAccessGranted)
            {
                return (false, "Access denied. You do not have permission to update your email. Please submit an email update request to a Backoffice officer.", null);
            }

            var newEmail = dto.NewEmail.Trim().ToLowerInvariant();

            // Validate not identical to existing email
            if (newEmail == user.Email.ToLowerInvariant())
            {
                return (false, "The new email address cannot be identical to your current email address.", null);
            }

            // Validate uniqueness across system
            var existing = await _db.UserDetails.Find(u => u.Email.ToLower() == newEmail && u.Nic != user.Nic).FirstOrDefaultAsync();
            if (existing != null)
            {
                return (false, "A user with this email address already exists in the system.", null);
            }

            if (user.EmailUpdateHistory == null)
            {
                user.EmailUpdateHistory = new List<DateTime>();
            }

            var now = DateTime.UtcNow;

            var update = Builders<UserDetails>.Update
                .Set(u => u.Email, newEmail)
                .Set(u => u.EmailUpdateAccessGranted, false) // Single-use access consumed!
                .Set(u => u.EmailUpdateRequestStatus, "Completed")
                .Set(u => u.RequestedNewEmail, null)
                .Push(u => u.EmailUpdateHistory, now)
                .Set(u => u.UpdatedAt, now);

            await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);

            user.Email = newEmail;
            user.EmailUpdateAccessGranted = false;
            user.EmailUpdateRequestStatus = "Completed";
            user.RequestedNewEmail = null;
            user.EmailUpdateHistory.Add(now);
            user.UpdatedAt = now;

            var remaining = Math.Max(0, 3 - GetUpdatesInLast24Hours(user));
            return (true, $"Email address updated successfully to {newEmail}. (Remaining updates allowed in 24h: {remaining})", MapToDto(user));
        }

        /// <summary>
        /// Calculates the number of email updates made by the user in the past 24 hours.
        /// </summary>
        private static int GetUpdatesInLast24Hours(UserDetails user)
        {
            // Calculate count of email updates performed within rolling 24-hour window
            if (user.EmailUpdateHistory == null || user.EmailUpdateHistory.Count == 0)
            {
                return 0;
            }
            var cutoff = DateTime.UtcNow.AddHours(-24);
            return user.EmailUpdateHistory.Count(t => t >= cutoff);
        }

        /// <summary>
        /// Maps UserDetails database model to client response DTO.
        /// </summary>
        // Internal mapping utility to avoid leaking password hashes
        private static UserResponseDto MapToDto(UserDetails user)
        {
            // Project UserDetails entity into safe client-facing UserResponseDto model
            var updatesIn24h = GetUpdatesInLast24Hours(user);
            return new UserResponseDto
            {
                Id = user.Nic,
                Nic = user.Nic,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                Status = user.Status,
                DeactivationRequested = user.DeactivationRequested,
                DeactivationReason = user.DeactivationReason,
                EmailUpdateAccessGranted = user.EmailUpdateAccessGranted,
                EmailUpdateRequestStatus = user.EmailUpdateRequestStatus,
                RequestedNewEmail = user.RequestedNewEmail,
                EmailUpdateRequestReason = user.EmailUpdateRequestReason,
                EmailUpdateRequestDate = user.EmailUpdateRequestDate,
                EmailUpdateReviewNotes = user.EmailUpdateReviewNotes,
                EmailUpdatesLast24Hours = updatesIn24h,
                EmailUpdatesRemaining24Hours = Math.Max(0, 3 - updatesIn24h),
                InstallationLatitude = user.InstallationLatitude,
                InstallationLongitude = user.InstallationLongitude,
                CreatedAt = user.CreatedAt
            };
        }
    }
}