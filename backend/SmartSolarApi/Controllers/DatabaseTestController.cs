// ============================================================================
// File: DatabaseTestController.cs
// Author:IT22166210, IT22207418, IT22106292, IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Diagnostics controller to verify MongoDB connectivity and write access.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarApi.Data;

namespace SmartSolarApi.Controllers
{
    /// <summary>
    /// Database diagnostic endpoints for testing MongoDB status.
    /// </summary>
    [ApiController]
    [Route("api/database")]
    public class DatabaseTestController : ControllerBase
    {
        private readonly MongoDbContext _db;

        /// <summary>
        /// Constructor injecting MongoDbContext.
        /// </summary>
        // Injects MongoDbContext for database connectivity testing
        public DatabaseTestController(MongoDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Tests MongoDB connection by writing a ping document to connectionTests collection.
        /// GET: api/database/test
        /// </summary>
        // Inserts a test ping document into the database and returns connection status
        [HttpGet("test")]
        public async Task<IActionResult> Test()
        {
            try
            {
                var document = new BsonDocument
                {
                    { "message", "MongoDB connection successful" },
                    { "createdAt", DateTime.UtcNow }
                };

                var collection = _db.UserDetails.Database.GetCollection<BsonDocument>("connectionTests");
                await collection.InsertOneAsync(document);

                return Ok(new
                {
                    message = "MongoDB connection successful"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "MongoDB connection failed",
                    error = ex.Message
                });
            }
        }
    }
}