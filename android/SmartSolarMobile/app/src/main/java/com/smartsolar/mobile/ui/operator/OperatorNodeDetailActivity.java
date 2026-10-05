// ============================================================================
// File: OperatorNodeDetailActivity.java
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator detailed station monitoring dashboard displaying live
//              metrics, availability for transactions sourced dynamically from Web API,
//              and upcoming reservation logs. Includes embedded OSM map layer.
// Architecture: FAT Service Pattern - Real-time polling via OkHttp endpoint
// ============================================================================
package com.smartsolar.mobile.ui.operator;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.content.res.ResourcesCompat;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.osmdroid.config.Configuration;
import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Real-time solar microgrid telemetry insight panel for Field Operators. */
public class OperatorNodeDetailActivity extends AppCompatActivity {

    private String stationId;

    // ── Telemetry Component Views ───────────────────────────────────────────
    private TextView tvNodeName, tvNodeId, tvAvailabilityStatus;
    private TextView tvOpStatus, tvGpsCoords, tvCapacity, tvTotalSlots, tvAvailableSlots, tvReservedSlots, tvSchedule;
    private LinearLayout layoutStatusBadge, layoutUpcomingBookings;
    private View progressBar;
    private MapView mapView;
    private Button btnGoogleMaps;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Configure OSMDroid, retrieve station ID from intent, bind views, and trigger telemetry fetch
        super.onCreate(savedInstanceState);

        // Initialize OSMDroid configuration state before loading content layout context tree
        Configuration.getInstance().load(this, getPreferences(MODE_PRIVATE));
        Configuration.getInstance().setUserAgentValue(getPackageName());

        setContentView(R.layout.activity_operator_node_detail);

        stationId = getIntent().getStringExtra("station_id");
        if (stationId == null || stationId.isEmpty()) {
            Toast.makeText(this, "Error: Node identifier package is missing.", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        bindViews();
        setupMapDefaults();

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());
        findViewById(R.id.btn_refresh).setOnClickListener(v -> refreshTelemetryData());

        refreshTelemetryData();
    }

    private void bindViews() {
        // Locate and map all node telemetry TextViews, status badge, map view, and button references
        tvNodeName             = findViewById(R.id.tv_node_name);
        tvNodeId               = findViewById(R.id.tv_node_id);
        tvAvailabilityStatus   = findViewById(R.id.tv_availability_status);
        tvOpStatus             = findViewById(R.id.tv_op_status);
        tvGpsCoords            = findViewById(R.id.tv_gps_coords);
        tvCapacity             = findViewById(R.id.tv_capacity);
        tvTotalSlots           = findViewById(R.id.tv_total_slots);
        tvAvailableSlots       = findViewById(R.id.tv_available_slots);
        tvReservedSlots        = findViewById(R.id.tv_reserved_slots);
        tvSchedule             = findViewById(R.id.tv_schedule);
        layoutStatusBadge      = findViewById(R.id.layout_status_badge);
        layoutUpcomingBookings = findViewById(R.id.layout_upcoming_bookings);
        progressBar            = findViewById(R.id.progress_bar);
        mapView                = findViewById(R.id.map_view);
        btnGoogleMaps          = findViewById(R.id.btn_open_google_maps_operator);
    }

    private void setupMapDefaults() {
        // Initialise embedded MapView properties, tile source, multi-touch gestures, and default zoom
        if (mapView == null) return;
        mapView.setTileSource(TileSourceFactory.MAPNIK);
        mapView.setBuiltInZoomControls(false);
        mapView.setMultiTouchControls(true);
        mapView.getController().setZoom(7.0);
        mapView.getController().setCenter(new GeoPoint(7.8731, 80.7718));
    }

    /** Triggers asynchronous refresh task orchestration pipelines */
    private void refreshTelemetryData() {
        // Fetch all stations from API, filter target station by ID, and update telemetry and bookings
        if (progressBar != null) progressBar.setVisibility(View.VISIBLE);

        // Pull latest JSON details package from C# Web API to ensure absolute authoritative data
        new Thread(() -> {
            try {
                Request req = ApiClient.buildAuthRequest(this, "stations").get().build();
                try (Response res = ApiClient.getClient().newCall(req).execute()) {
                    if (res.body() != null) {
                        String payload = res.body().string();
                        JSONArray stations = new JSONArray(payload);
                        JSONObject target = null;

                        for (int i = 0; i < stations.length(); i++) {
                            JSONObject obj = stations.getJSONObject(i);
                            if (stationId.equals(obj.optString("id"))) {
                                target = obj;
                                break;
                            }
                        }

                        if (target != null) {
                            final JSONObject finalTarget = target;
                            runOnUiThread(() -> {
                                updateNodeTelemetryUI(finalTarget);
                                loadNodeBookings();
                            });
                        } else {
                            runOnUiThread(() -> {
                                if (progressBar != null) progressBar.setVisibility(View.GONE);
                                Toast.makeText(OperatorNodeDetailActivity.this,
                                        "Station not found in current fleet telemetry.", Toast.LENGTH_SHORT).show();
                            });
                        }
                    }
                }
            } catch (Exception e) {
                runOnUiThread(() -> {
                    if (progressBar != null) progressBar.setVisibility(View.GONE);
                    Toast.makeText(OperatorNodeDetailActivity.this,
                            "Communication error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
            }
        }).start();
    }

    /** Authoritatively processes JSON payload response records returned directly by C# Web API endpoints */
    private void updateNodeTelemetryUI(JSONObject station) {
        // Render station capacity, slot availability, trading eligibility, map marker, and Google Maps link
        if (station == null) return;

        try {
            String name     = station.optString("name", "Microgrid Node");
            String code     = station.optString("stationCode", "—");
            String opStatus = station.optString("status", "Unknown");
            double lat      = station.optDouble("latitude", 0.0);
            double lng      = station.optDouble("longitude", 0.0);
            double cap      = station.optDouble("capacityKWh", 0.0);
            int total       = station.optInt("totalBatterySlots", 0);
            int available   = station.optInt("availableBatterySlots", 0);
            int reserved    = total - available;
            String schedule = station.optString("operationalSchedule", "N/A");

            tvNodeName.setText(name);
            tvNodeId.setText("Node Code: " + code);
            tvOpStatus.setText(opStatus);
            tvGpsCoords.setText(String.format(Locale.getDefault(), "%.5f, %.5f", lat, lng));
            tvCapacity.setText(cap + " kW");
            tvTotalSlots.setText(String.valueOf(total));
            tvAvailableSlots.setText(available + " slots free");
            tvReservedSlots.setText(reserved + " slots filled");
            tvSchedule.setText(schedule);

            // Transaction execution eligibility color state evaluation
            boolean isEligible = "Active".equalsIgnoreCase(opStatus) && available > 0;
            if (isEligible) {
                layoutStatusBadge.setBackgroundColor(ContextCompat.getColor(this, R.color.neuro_green_bg));
                tvAvailabilityStatus.setText("AVAILABLE FOR TRADING");
                tvAvailabilityStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_green_dark));
            } else {
                layoutStatusBadge.setBackgroundColor(ContextCompat.getColor(this, R.color.neuro_danger_bg));
                tvAvailabilityStatus.setText("Active".equalsIgnoreCase(opStatus)
                        ? "FULLY RESERVED — SLOTS SATURATED"
                        : "OFFLINE — MAINTENANCE RESTRICTED");
                tvAvailabilityStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_danger_dark));
            }

            // Sync OSM map marker pointer placement
            if (mapView != null && lat != 0.0 && lng != 0.0) {
                mapView.getOverlays().clear();
                GeoPoint point = new GeoPoint(lat, lng);
                Marker marker = new Marker(mapView);
                marker.setPosition(point);
                marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
                marker.setTitle(name);
                marker.setSnippet("Status: " + opStatus + " | " + available + " slots available");
                android.graphics.drawable.Drawable hubIcon =
                        ResourcesCompat.getDrawable(getResources(), R.drawable.ic_map_hub, null);
                if (hubIcon != null) marker.setIcon(hubIcon);
                mapView.getOverlays().add(marker);
                mapView.getController().setCenter(point);
                mapView.getController().setZoom(15.0);
                mapView.invalidate();
            }

            // Wire Google Maps navigation intent for field operators
            if (btnGoogleMaps != null && lat != 0.0 && lng != 0.0) {
                final double fLat = lat, fLng = lng;
                final String fName = name, fCode = code;
                btnGoogleMaps.setOnClickListener(v -> {
                    try {
                        android.net.Uri uri = android.net.Uri.parse(
                                "geo:" + fLat + "," + fLng + "?q=" + android.net.Uri.encode(fName + " [" + fCode + "]"));
                        Intent mapIntent = new Intent(Intent.ACTION_VIEW, uri);
                        mapIntent.setPackage("com.google.android.apps.maps");
                        if (mapIntent.resolveActivity(getPackageManager()) != null) {
                            startActivity(mapIntent);
                        } else {
                            startActivity(new Intent(Intent.ACTION_VIEW,
                                    android.net.Uri.parse("https://www.google.com/maps/search/?api=1&query=" + fLat + "," + fLng)));
                        }
                    } catch (Exception e) {
                        startActivity(new Intent(Intent.ACTION_VIEW,
                                android.net.Uri.parse("https://www.google.com/maps/search/?api=1&query=" + fLat + "," + fLng)));
                    }
                });
            }

        } catch (Exception ignored) {}
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Bookings List
    // ══════════════════════════════════════════════════════════════════════════

    /** Synchronizes reservation records list matching specific target station allocation fields */
    private void loadNodeBookings() {
        // Fetch all reservations and filter for items specifically scheduled at this station
        new Thread(() -> {
            try {
                Request req = ApiClient.buildAuthRequest(this, "reservations").get().build();
                try (Response res = ApiClient.getClient().newCall(req).execute()) {
                    if (res.body() != null) {
                        String payload = res.body().string();
                        JSONArray array = new JSONArray(payload);

                        runOnUiThread(() -> {
                            if (progressBar != null) progressBar.setVisibility(View.GONE);
                            if (layoutUpcomingBookings == null) return;

                            layoutUpcomingBookings.removeAllViews();
                            int logMatches = 0;
                            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());

                            for (int i = 0; i < array.length(); i++) {
                                try {
                                    JSONObject b = array.getJSONObject(i);
                                    if (!stationId.equals(b.optString("stationId"))) continue;

                                    logMatches++;
                                    View itemCard = LayoutInflater.from(this).inflate(
                                            R.layout.item_energy_transfer, layoutUpcomingBookings, false);

                                    TextView tvDate   = itemCard.findViewById(R.id.tv_transfer_date);
                                    TextView tvHub    = itemCard.findViewById(R.id.tv_transfer_hub);
                                    TextView tvTime   = itemCard.findViewById(R.id.tv_transfer_time);
                                    TextView tvStatus = itemCard.findViewById(R.id.tv_transfer_status);
                                    TextView tvEnergy = itemCard.findViewById(R.id.tv_transfer_energy);

                                    String prosumer = b.optString("prosumerName", "Prosumer Agent");
                                    String dateStr  = b.optString("scheduledDateTime", "");
                                    int bookingSlot = b.optInt("slotNumber", 0);

                                    if (tvDate != null) {
                                        String slotTag = bookingSlot > 0 ? "  ·  Slot #" + bookingSlot : "";
                                        tvDate.setText(prosumer + slotTag);
                                    }
                                    if (tvHub != null) {
                                        String dateSub = dateStr.length() >= 10 ? dateStr.substring(0, 10) : dateStr;
                                        tvHub.setText(dateSub.equals(today) ? "Scheduled today" : "Date: " + dateSub);
                                    }
                                    if (tvTime != null) {
                                        tvTime.setText(dateStr.length() >= 16 ? dateStr.substring(11, 16) : "N/A");
                                    }

                                    String bStatus = b.optString("status", "Pending");
                                    if (tvStatus != null) {
                                        tvStatus.setText(bStatus);
                                        if ("Completed".equalsIgnoreCase(bStatus)) {
                                            tvStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));
                                        } else if ("Pending".equalsIgnoreCase(bStatus)) {
                                            tvStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_amber));
                                        } else {
                                            tvStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
                                        }
                                    }

                                    if (tvEnergy != null) {
                                        tvEnergy.setText(b.optDouble("energyAmountKWh", 0.0) + " kWh");
                                    }

                                    // Redirect operator to Booking Detail insight screen when cell is tapped
                                    itemCard.setOnClickListener(v -> {
                                        Intent intent = new Intent(OperatorNodeDetailActivity.this,
                                                OperatorBookingDetailActivity.class);
                                        try { intent.putExtra("booking_id", b.getString("id")); } catch (Exception ignored) {}
                                        startActivity(intent);
                                    });

                                    layoutUpcomingBookings.addView(itemCard);
                                } catch (Exception ignored) {}
                            }

                            if (logMatches == 0) {
                                TextView tvNone = new TextView(this);
                                tvNone.setText("No upcoming reservation bookings configured for this station.");
                                tvNone.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
                                tvNone.setTextSize(13f);
                                tvNone.setPadding(12, 16, 12, 16);
                                layoutUpcomingBookings.addView(tvNone);
                            }
                        });
                    }
                }
            } catch (Exception ignored) {
                runOnUiThread(() -> { if (progressBar != null) progressBar.setVisibility(View.GONE); });
            }
        }).start();
    }

    @Override public void onResume() { super.onResume(); if (mapView != null) mapView.onResume(); }
    @Override public void onPause()  { super.onPause();  if (mapView != null) mapView.onPause();  }
}
