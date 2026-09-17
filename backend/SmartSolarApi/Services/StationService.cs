public class StationService
{
/// <summary>
/// Deactivates a microgrid node. Strictly blocked if active energy reservations exist.
/// </summary>
// Enforces core SE4040 rule: Deactivation is blocked if active energy reservations exist
private async Task<(bool Success, string Message)> DeactivateStationAsync(string id)
{
    var station = await _db.SolarStationInfo
        .Find(s => s.Id == id)
        .FirstOrDefaultAsync();

    if (station == null)
    {
        return (false, "Station not found.");
    }

    if (station.Status.Equals("Inactive", StringComparison.OrdinalIgnoreCase) ||
        station.Status.Equals("Deactivated", StringComparison.OrdinalIgnoreCase))
    {
        return (
            false,
            $"Microgrid station '{station.Name}' is already deactivated.");
    }

    var activeReservations =
        await _db.EnergyReservation.CountDocumentsAsync(r =>
            (r.StationId == id ||
             r.StationId == station.Id ||
             r.StationName == station.Name) &&
            (r.Status == "Approved" ||
             r.Status == "Pending" ||
             (r.Status != "Completed" &&
              r.Status != "Cancelled")));

    if (activeReservations > 0)
    {
        return (
            false,
            $"Station deactivation blocked! Cannot deactivate node '{station.Name}' because {activeReservations} active energy reservation(s) currently exist. All active reservations must be completed or cancelled before this node can be deactivated.");
    }

    var update = Builders<SolarStationInfo>.Update
        .Set(s => s.Status, "Inactive")
        .Set(s => s.UpdatedAt, DateTime.UtcNow);

    await _db.SolarStationInfo.UpdateOneAsync(
        s => s.Id == id,
        update);

    return (
        true,
        $"Microgrid station {station.Name} ({station.StationCode}) deactivated successfully.");
}

/// <summary>
/// Updates available battery storage slots.
/// </summary>
// Allows field operators to adjust real-time battery slot count
public async Task<(bool Success, string Message)> UpdateBatterySlotsAsync(
    string id,
    int availableSlots)
{
    var station = await _db.SolarStationInfo
        .Find(s => s.Id == id)
        .FirstOrDefaultAsync();

    if (station == null)
    {
        return (false, "Station not found.");
    }

    if (availableSlots > station.TotalBatterySlots)
    {
        return (
            false,
            $"Available slots cannot exceed total configured slots ({station.TotalBatterySlots}).");
    }

    var update = Builders<SolarStationInfo>.Update
        .Set(s => s.AvailableBatterySlots, availableSlots)
        .Set(s => s.UpdatedAt, DateTime.UtcNow);

    await _db.SolarStationInfo.UpdateOneAsync(
        s => s.Id == id,
        update);

    return (
        true,
        $"Battery slots updated to {availableSlots} available slots.");
}
}