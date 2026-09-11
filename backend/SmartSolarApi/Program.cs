// ============================================================================
// File: Program.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Application startup and configuration entry point for the Smart
//              Solar Microgrid Central Web API. Configures dependency injection,
//              FAT service components, CORS, MongoDB, and automatic seeding.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var app = builder.Build();

app.MapControllers();

app.Run();