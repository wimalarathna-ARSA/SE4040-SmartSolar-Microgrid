// ============================================================================
// File: DatabaseHelper.java
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: SQLiteOpenHelper managing local SQLite database for the Pure
//              Native Android App. Persists user session, cached stations,
//              and booking data locally for offline display support.
// Architecture: FAT Service Pattern - All business logic centralized in C# API.
//               SQLite is strictly a local cache/session store only.
// ============================================================================
package com.smartsolar.mobile.data;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * SQLiteOpenHelper for managing the local cache database.
 * Stores session info, cached station data, and booking history for offline viewing.
 */
public class DatabaseHelper extends SQLiteOpenHelper {

    // Database configuration constants
    private static final String DATABASE_NAME = "SmartSolarLocal.db";
    private static final int DATABASE_VERSION = 3;

    // Assignment tables mirrored from the central MongoDB collections
    public static final String TABLE_USER_DETAILS = "UserDetails";
    public static final String TABLE_SOLAR_STATION_INFO = "SolarStationInfo";
    public static final String TABLE_ENERGY_BOOKING_SLOTS = "EnergyBookingSlots";
    public static final String TABLE_ENERGY_RESERVATION = "EnergyReservation";

    // Table: user_session - Stores authenticated user's session and JWT token
    public static final String TABLE_USER_SESSION = "user_session";
    public static final String COL_SESSION_ID = "id";
    public static final String COL_SESSION_NIC = "nic";
    public static final String COL_SESSION_NAME = "full_name";
    public static final String COL_SESSION_EMAIL = "email";
    public static final String COL_SESSION_ROLE = "role";
    public static final String COL_SESSION_STATUS = "status";
    public static final String COL_SESSION_TOKEN = "token";
    public static final String COL_SESSION_CREATED = "created_at";

    // Table: cached_stations - Locally cached microgrid station data for offline display
    public static final String TABLE_CACHED_STATIONS = "cached_stations";
    public static final String COL_STATION_ID = "station_id";
    public static final String COL_STATION_CODE = "station_code";
    public static final String COL_STATION_NAME = "name";
    public static final String COL_STATION_LOCATION = "location";
    public static final String COL_STATION_LAT = "latitude";
    public static final String COL_STATION_LNG = "longitude";
    public static final String COL_STATION_CAPACITY = "capacity_kwh";
    public static final String COL_STATION_AVAIL_SLOTS = "available_battery_slots";
    public static final String COL_STATION_TOTAL_SLOTS = "total_battery_slots";
    public static final String COL_STATION_SCHEDULE = "operational_schedule";
    public static final String COL_STATION_STATUS = "status";
    public static final String COL_STATION_CACHED_AT = "cached_at";

    // Table: cached_bookings - Locally cached energy reservations for offline history view
    public static final String TABLE_CACHED_BOOKINGS = "cached_bookings";
    public static final String COL_BOOKING_ID = "booking_id";
    public static final String COL_BOOKING_CODE = "reservation_code";
    public static final String COL_BOOKING_PROSUMER_NIC = "prosumer_nic";
    public static final String COL_BOOKING_STATION_NAME = "station_name";
    public static final String COL_BOOKING_SCHEDULED = "scheduled_date_time";
    public static final String COL_BOOKING_ENERGY = "energy_kwh";
    public static final String COL_BOOKING_COST = "total_cost";
    public static final String COL_BOOKING_TYPE = "reservation_type";
    public static final String COL_BOOKING_STATUS = "status";
    public static final String COL_BOOKING_QR_DATA = "qr_code_data";
    public static final String COL_BOOKING_CACHED_AT = "cached_at";

    /**
     * Constructor for DatabaseHelper.
     */
    // Initializes with app context, database name, and version
    public DatabaseHelper(Context context) {
        // Initialize SQLiteOpenHelper with local cache database name and schema version
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    /**
     * Creates all required SQLite tables on first database creation.
     */
    // Creates user_session, cached_stations, and cached_bookings tables
    @Override
    public void onCreate(SQLiteDatabase db) {
        // Create SQLite database tables for session management, station caching, and reservation history
        db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_USER_SESSION + " (" +
                COL_SESSION_NIC + " TEXT PRIMARY KEY NOT NULL, " +
                COL_SESSION_NAME + " TEXT NOT NULL, " +
                COL_SESSION_EMAIL + " TEXT NOT NULL, " +
                COL_SESSION_ROLE + " TEXT NOT NULL, " +
                COL_SESSION_STATUS + " TEXT NOT NULL, " +
                COL_SESSION_TOKEN + " TEXT NOT NULL, " +
                COL_SESSION_CREATED + " TEXT NOT NULL" +
                ")");

            db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_USER_DETAILS + " (" +
                "nic TEXT PRIMARY KEY NOT NULL, full_name TEXT NOT NULL, email TEXT, role TEXT, " +
                "phone_number TEXT, address TEXT, installation_latitude REAL, installation_longitude REAL, " +
                "status TEXT, created_at TEXT, updated_at TEXT, cached_at TEXT)");

            db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_SOLAR_STATION_INFO + " (" +
                "id TEXT PRIMARY KEY NOT NULL, station_code TEXT, name TEXT NOT NULL, location TEXT, " +
                "latitude REAL, longitude REAL, capacity_kwh REAL, available_battery_slots INTEGER, " +
                "total_battery_slots INTEGER, operational_schedule TEXT, status TEXT, created_at TEXT, " +
                "updated_at TEXT, cached_at TEXT)");

            db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_ENERGY_BOOKING_SLOTS + " (" +
                "id TEXT PRIMARY KEY NOT NULL, station_id TEXT NOT NULL, station_name TEXT, " +
                "slot_start_time TEXT, slot_end_time TEXT, max_capacity_kwh REAL, " +
                "available_capacity_kwh REAL, price_per_kwh REAL, status TEXT, cached_at TEXT, " +
                "created_at TEXT, FOREIGN KEY(station_id) REFERENCES " + TABLE_SOLAR_STATION_INFO + "(id))");

            db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_ENERGY_RESERVATION + " (" +
                "id TEXT PRIMARY KEY NOT NULL, reservation_code TEXT, prosumer_nic TEXT NOT NULL, prosumer_name TEXT, " +
                "station_id TEXT NOT NULL, station_name TEXT, slot_id TEXT, slot_number INTEGER, scheduled_date_time TEXT, " +
                "duration_hours INTEGER, energy_amount_kwh REAL, total_cost REAL, reservation_type TEXT, " +
                "status TEXT, qr_code_data TEXT, completed_at TEXT, operator_nic TEXT, operator_notes TEXT, " +
                "created_at TEXT, updated_at TEXT, cached_at TEXT, " +
                "FOREIGN KEY(prosumer_nic) REFERENCES " + TABLE_USER_DETAILS + "(nic), " +
                "FOREIGN KEY(station_id) REFERENCES " + TABLE_SOLAR_STATION_INFO + "(id))");

        // Create cached_stations table for offline station display and map markers
        db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_CACHED_STATIONS + " (" +
                COL_STATION_ID + " TEXT PRIMARY KEY, " +
                COL_STATION_CODE + " TEXT, " +
                COL_STATION_NAME + " TEXT, " +
                COL_STATION_LOCATION + " TEXT, " +
                COL_STATION_LAT + " REAL, " +
                COL_STATION_LNG + " REAL, " +
                COL_STATION_CAPACITY + " REAL, " +
                COL_STATION_AVAIL_SLOTS + " INTEGER, " +
                COL_STATION_TOTAL_SLOTS + " INTEGER, " +
                COL_STATION_SCHEDULE + " TEXT, " +
                COL_STATION_STATUS + " TEXT, " +
                COL_STATION_CACHED_AT + " TEXT" +
                ")");

        // Create cached_bookings table for offline energy reservation history
        db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_CACHED_BOOKINGS + " (" +
                COL_BOOKING_ID + " TEXT PRIMARY KEY, " +
                COL_BOOKING_CODE + " TEXT, " +
                COL_BOOKING_PROSUMER_NIC + " TEXT, " +
                COL_BOOKING_STATION_NAME + " TEXT, " +
                COL_BOOKING_SCHEDULED + " TEXT, " +
                COL_BOOKING_ENERGY + " REAL, " +
                COL_BOOKING_COST + " REAL, " +
                COL_BOOKING_TYPE + " TEXT, " +
                COL_BOOKING_STATUS + " TEXT, " +
                COL_BOOKING_QR_DATA + " TEXT, " +
                COL_BOOKING_CACHED_AT + " TEXT" +
                ")");
    }

    
    /**
     * Handles database schema migration on version upgrades.
     */
    // Drops and recreates tables when schema version changes
    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Rebuild database tables when database version number is incremented
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_USER_SESSION);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_CACHED_STATIONS);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_CACHED_BOOKINGS);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_ENERGY_RESERVATION);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_ENERGY_BOOKING_SLOTS);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_SOLAR_STATION_INFO);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_USER_DETAILS);
        onCreate(db);
    }

    @Override
    public void onDowngrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Delegate downgrade behavior to onUpgrade to recreate local tables
        onUpgrade(db, oldVersion, newVersion);
    }

    /**
     * Saves authenticated user session and JWT token to SQLite.
     */
    // Clears existing session and inserts new logged-in user data
    public void saveSession(String nic, String fullName, String email, String role, String status, String token) {
        // Persist user session details and JWT bearer token into local SQLite storage
        SQLiteDatabase db = this.getWritableDatabase();
        db.execSQL("DELETE FROM " + TABLE_USER_SESSION);
        ContentValues values = new ContentValues();
        values.put(COL_SESSION_NIC, nic);
        values.put(COL_SESSION_NAME, fullName);
        values.put(COL_SESSION_EMAIL, email);
        values.put(COL_SESSION_ROLE, role);
        values.put(COL_SESSION_STATUS, status);
        values.put(COL_SESSION_TOKEN, token);
        values.put(COL_SESSION_CREATED, getCurrentTimestamp());
        db.insert(TABLE_USER_SESSION, null, values);
        ContentValues user = new ContentValues();
        user.put("nic", nic); user.put("full_name", fullName); user.put("email", email);
        user.put("role", role); user.put("status", status); user.put("cached_at", getCurrentTimestamp());
        db.insertWithOnConflict(TABLE_USER_DETAILS, null, user, SQLiteDatabase.CONFLICT_REPLACE);
        db.close();
    }

    public void cacheUser(String nic, String fullName, String email, String role, String phone, String address, String status, String createdAt) {
        // Store user profile details into local UserDetails cache table
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("nic", nic); values.put("full_name", fullName); values.put("email", email);
        values.put("role", role); values.put("phone_number", phone); values.put("address", address);
        values.put("status", status); values.put("created_at", createdAt); values.put("cached_at", getCurrentTimestamp());
        db.insertWithOnConflict(TABLE_USER_DETAILS, null, values, SQLiteDatabase.CONFLICT_REPLACE);
        db.close();
    }

    public void cacheSolarStation(String id, String code, String name, String location, double latitude, double longitude,
                                   double capacity, int availableSlots, int totalSlots, String schedule, String status) {
        // Cache solar microgrid station telemetry, capacity, and GPS coordinates locally
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("id", id); values.put("station_code", code); values.put("name", name); values.put("location", location);
        values.put("latitude", latitude); values.put("longitude", longitude); values.put("capacity_kwh", capacity);
        values.put("available_battery_slots", availableSlots); values.put("total_battery_slots", totalSlots);
        values.put("operational_schedule", schedule); values.put("status", status); values.put("cached_at", getCurrentTimestamp());
        db.insertWithOnConflict(TABLE_SOLAR_STATION_INFO, null, values, SQLiteDatabase.CONFLICT_REPLACE);
        db.close();
    }

    public void cacheEnergyBookingSlot(String id, String stationId, String stationName, String start, String end,
                                        double maxCapacity, double availableCapacity, double price, String status) {
        // Persist battery booking slot information for offline access
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("id", id); values.put("station_id", stationId); values.put("station_name", stationName);
        values.put("slot_start_time", start); values.put("slot_end_time", end); values.put("max_capacity_kwh", maxCapacity);
        values.put("available_capacity_kwh", availableCapacity); values.put("price_per_kwh", price);
        values.put("status", status); values.put("cached_at", getCurrentTimestamp());
        db.insertWithOnConflict(TABLE_ENERGY_BOOKING_SLOTS, null, values, SQLiteDatabase.CONFLICT_REPLACE);
        db.close();
    }

    public void cacheEnergyReservation(String id, String code, String prosumerNic, String stationId, String stationName,
                                       String scheduled, int duration, double energy, double cost, String type,
                                       String status, String qrData) {
        // Cache prosumer reservation details and QR payload for offline verification
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("id", id); values.put("reservation_code", code); values.put("prosumer_nic", prosumerNic);
        values.put("station_id", stationId); values.put("station_name", stationName); values.put("scheduled_date_time", scheduled);
        values.put("duration_hours", duration); values.put("energy_amount_kwh", energy); values.put("total_cost", cost);
        values.put("reservation_type", type); values.put("status", status); values.put("qr_code_data", qrData);
        values.put("cached_at", getCurrentTimestamp());
        db.insertWithOnConflict(TABLE_ENERGY_RESERVATION, null, values, SQLiteDatabase.CONFLICT_REPLACE);
        db.close();
    }
}