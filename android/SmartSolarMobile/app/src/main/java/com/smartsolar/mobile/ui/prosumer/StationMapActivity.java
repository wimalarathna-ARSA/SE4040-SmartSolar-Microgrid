// ============================================================================
// File: StationMapActivity.java
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Interactive OSMDroid map plotting nearby microgrid nodes from stored coordinates with Google Maps navigation.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.*;
import androidx.core.app.ActivityCompat;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.res.ResourcesCompat;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.DatabaseHelper;
import com.smartsolar.mobile.data.SessionManager;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.osmdroid.config.Configuration;
import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;
import java.util.ArrayList;
import java.util.List;

/** OSMDroid map showing nearby solar microgrid stations as tap-able GPS markers. */
public class StationMapActivity extends AppCompatActivity {

    private MapView mapView;
    private View progressBar;
    private TextView tvStatus;
    private EditText etSearch;
    private LinearLayout panelInfo;
    private TextView tvPanelName, tvPanelDetails;
    private Button btnReserveThis;
    private Button btnGoogleMaps;

    private SessionManager sessionManager;
    private String targetStationId;
    private final List<Marker> stationMarkers = new ArrayList<>();
    private Marker userInstallationMarker;
    private static final int LOCATION_PERMISSION_REQUEST = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Configure OSMDroid, request location permissions, initialise map views, and setup search
        super.onCreate(savedInstanceState);

        Configuration.getInstance().load(this, getPreferences(MODE_PRIVATE));
        Configuration.getInstance().setUserAgentValue(getPackageName());

        setContentView(R.layout.activity_station_map);

        sessionManager = new SessionManager(this);
        targetStationId = getIntent().getStringExtra("target_station_id");

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());
        mapView    = findViewById(R.id.map_view);
        progressBar = findViewById(R.id.progress_bar);
        tvStatus   = findViewById(R.id.tv_map_status);
        etSearch   = findViewById(R.id.et_search_map);
        
        panelInfo  = findViewById(R.id.panel_station_info);
        tvPanelName = findViewById(R.id.tv_panel_name);
        tvPanelDetails = findViewById(R.id.tv_panel_details);
        btnReserveThis = findViewById(R.id.btn_reserve_this);
        btnGoogleMaps  = findViewById(R.id.btn_open_google_maps);

        mapView.setTileSource(TileSourceFactory.MAPNIK);
        mapView.setBuiltInZoomControls(false); 
        mapView.setMultiTouchControls(true);

        mapView.getController().setZoom(8.0);
        mapView.getController().setCenter(new GeoPoint(7.8731, 80.7718));

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, LOCATION_PERMISSION_REQUEST);
        }

        setupSearch();
    }

    private void setupSearch() {
        // Attach TextWatcher to search bar to filter station map markers by name or code dynamically
        etSearch.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterMarkers(s.toString());
            }
            @Override public void afterTextChanged(Editable s) {}
        });
    }

    private void filterMarkers(String query) {
        // Filter visible station markers on the map canvas based on user query string
        String q = query.toLowerCase();
        for (Marker m : stationMarkers) {
            boolean visible = m.getTitle().toLowerCase().contains(q) || (m.getSnippet() != null && m.getSnippet().toLowerCase().contains(q));
            if (visible) {
                if (!mapView.getOverlays().contains(m)) mapView.getOverlays().add(m);
            } else {
                mapView.getOverlays().remove(m);
            }
        }
        mapView.invalidate();
    }

    private void loadUserInstallationAndStations() {
        // Fetch prosumer installation GPS coordinates from API and pin user installation marker
        progressBar.setVisibility(View.VISIBLE);
        String nic = sessionManager.getNic();
        
        new Thread(() -> {
            try {
                Request userReq = ApiClient.buildAuthRequest(this, "users/" + nic).get().build();
                Response userRes = ApiClient.getClient().newCall(userReq).execute();
                if (userRes.isSuccessful() && userRes.body() != null) {
                    JSONObject user = new JSONObject(userRes.body().string());
                    double uLat = user.optDouble("installationLatitude", 0);
                    double uLng = user.optDouble("installationLongitude", 0);

                    runOnUiThread(() -> {
                        if (userInstallationMarker != null) {
                            mapView.getOverlays().remove(userInstallationMarker);
                            userInstallationMarker = null;
                        }

                        if (uLat != 0 && uLng != 0) {
                            Marker uMarker = new Marker(mapView);
                            uMarker.setPosition(new GeoPoint(uLat, uLng));
                            uMarker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
                            uMarker.setTitle("You");
                            uMarker.setSnippet("My Installation Point");
                            
                            // Use red location icon for the user
                            Drawable icon = ResourcesCompat.getDrawable(getResources(), R.drawable.ic_line_location, null);
                            if (icon != null) {
                                icon.setTint(Color.RED);
                                uMarker.setIcon(icon);
                            }
                            
                            mapView.getOverlays().add(uMarker);
                            userInstallationMarker = uMarker;

                            if (targetStationId == null) {
                                mapView.getController().setCenter(new GeoPoint(uLat, uLng));
                                mapView.getController().setZoom(14.0);
                            }
                        }
                        mapView.invalidate();
                    });
                }
            } catch (Exception ignored) {}
            loadStationMarkers();
        }).start();
    }

    private void loadStationMarkers() {
        // Fetch all active solar stations from API, cache in SQLite, and add markers with click listeners
        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this, "stations?status=Active").get().build();
                Response response = ApiClient.getClient().newCall(request).execute();
                String body = response.body().string();
                JSONArray array = new JSONArray(body);

                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    int foundCount = 0;
                    for (Marker marker : stationMarkers) {
                        mapView.getOverlays().remove(marker);
                    }
                    stationMarkers.clear();

                    for (int i = 0; i < array.length(); i++) {
                        try {
                            JSONObject station = array.getJSONObject(i);
                            final String stationId = station.optString("id");

                            if (targetStationId != null && !targetStationId.equals(stationId)) continue;

                            double lat = station.getDouble("latitude");
                            double lng = station.getDouble("longitude");
                            String name = station.getString("name");
                            String code = station.optString("stationCode");
                            int slots   = station.optInt("availableBatterySlots");
                            double cap  = station.optDouble("capacityKWh");
                            String schedule = station.optString("operationalSchedule");

                                new DatabaseHelper(StationMapActivity.this).cacheSolarStation(
                                    stationId, code, name, station.optString("location"), lat, lng, cap,
                                    slots, station.optInt("totalBatterySlots"), schedule, station.optString("status"));

                            Marker marker = new Marker(mapView);
                            marker.setPosition(new GeoPoint(lat, lng));
                            marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
                            marker.setTitle(name + " [" + code + "]");
                            marker.setSnippet(slots + " battery slots free | " + cap + " kWh | " + schedule);

                            marker.setOnMarkerClickListener((m, mv) -> {
                                showStationPanel(name, code, slots, cap, schedule, stationId, lat, lng);
                                return true;
                            });

                            mapView.getOverlays().add(marker);
                            stationMarkers.add(marker);
                            foundCount++;

                            cacheStationSlots(stationId);

                            if (targetStationId != null && targetStationId.equals(stationId)) {
                                mapView.getController().setCenter(new GeoPoint(lat, lng));
                                mapView.getController().setZoom(16.0);
                                showStationPanel(name, code, slots, cap, schedule, stationId, lat, lng);
                            }
                        } catch (Exception ignored) {}
                    }
                    
                    if (targetStationId != null) tvStatus.setText("Focusing on selected station");
                    else tvStatus.setText(foundCount + " solar hubs found");
                    
                    mapView.invalidate();
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    tvStatus.setText("Failed to load stations.");
                });
            }
        }).start();
    }

    private void cacheStationSlots(String stationId) {
        // Asynchronously fetch battery slot records for station and cache in SQLite helper
        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this, "stations/" + stationId + "/slots").get().build();
                try (Response response = ApiClient.getClient().newCall(request).execute()) {
                    if (!response.isSuccessful() || response.body() == null) return;
                    JSONArray slots = new JSONArray(response.body().string());
                    for (int i = 0; i < slots.length(); i++) {
                        JSONObject slot = slots.getJSONObject(i);
                        new DatabaseHelper(StationMapActivity.this).cacheEnergyBookingSlot(
                                slot.optString("id"), stationId, slot.optString("stationName"),
                                slot.optString("slotStartTime"), slot.optString("slotEndTime"),
                                slot.optDouble("maxCapacityKWh"), slot.optDouble("availableCapacityKWh"),
                                slot.optDouble("pricePerKWh"), slot.optString("status"));
                    }
                }
            } catch (Exception ignored) {}
        }).start();
    }

    private void showStationPanel(String name, String code, int slots, double cap, String schedule, String stationId, double lat, double lng) {
        // Display bottom sheet panel with station specifications, booking shortcut, and Google Maps intent
        tvPanelName.setText(name + " [" + code + "]");
        tvPanelDetails.setText(slots + " slots available • " + cap + " kWh capacity\nSchedule: " + schedule);
        
        btnReserveThis.setOnClickListener(v -> {
            Intent intent = new Intent(this, CreateReservationActivity.class);
            intent.putExtra("selected_station_id", stationId);
            startActivity(intent);
        });

        if (btnGoogleMaps != null) {
            btnGoogleMaps.setOnClickListener(v -> {
                try {
                    android.net.Uri gmmIntentUri = android.net.Uri.parse("geo:" + lat + "," + lng + "?q=" + android.net.Uri.encode(name + " [" + code + "]"));
                    Intent mapIntent = new Intent(Intent.ACTION_VIEW, gmmIntentUri);
                    mapIntent.setPackage("com.google.android.apps.maps");
                    if (mapIntent.resolveActivity(getPackageManager()) != null) {
                        startActivity(mapIntent);
                    } else {
                        android.net.Uri webUri = android.net.Uri.parse("https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng);
                        startActivity(new Intent(Intent.ACTION_VIEW, webUri));
                    }
                } catch (Exception e) {
                    android.net.Uri webUri = android.net.Uri.parse("https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng);
                    startActivity(new Intent(Intent.ACTION_VIEW, webUri));
                }
            });
        }

        panelInfo.setVisibility(View.VISIBLE);
    }

    @Override public void onResume() {
        // Resume OSMDroid map tile rendering engine and refresh user installation and station markers
        super.onResume();
        if (mapView != null) {
            mapView.onResume();
            loadUserInstallationAndStations();
        }
    }
    @Override public void onPause() {
        // Pause OSMDroid map tile rendering when activity goes into the background
        super.onPause();
        if (mapView != null) mapView.onPause();
    }
}
