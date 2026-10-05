// ============================================================================
// File: Program.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Application startup and configuration entry point for the Smart
//              Solar Microgrid Central Web API. Configures dependency injection,
//              FAT service components, CORS, MongoDB, and automatic seeding.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SmartSolarApi.Data;
using SmartSolarApi.Services;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// Dependency Injection: Services & Database
// ============================================================================

// Controllers configuration
builder.Services.AddControllers();

// CORS Policy allowing React frontend and Android clients to communicate seamlessly
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllClients", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// OpenAPI configuration for API documentation and exploration
builder.Services.AddOpenApi();

// Register MongoDB Database Context as Singleton
builder.Services.AddSingleton<MongoDbContext>();

// Register FAT Business Logic Services
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<StationService>();
builder.Services.AddScoped<ReservationService>();
builder.Services.AddHostedService<MissedReservationBackgroundService>();

// JWT Authentication Configuration
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SmartSolarSecretKey2026SuperSecureMicrogridEnterpriseSystemToken12345!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SmartSolarApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SmartSolarClients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// ============================================================================
// Database Initialization & Automatic Seeding
// ============================================================================
using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
        await dbContext.EnsureUserDetailsNicPrimaryKeyAsync();
        // Automatically seed initial administrators, stations, slots and prosumers
        await DbSeeder.SeedAsync(dbContext);
        Console.WriteLine("[SmartSolarApi] MongoDB initialized and seeded successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[SmartSolarApi] Note on MongoDB initial connection/seeding: {ex.Message}");
    }
}

// ============================================================================
// HTTP Request Pipeline Configuration
// ============================================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAllClients");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();