// ============================================================================
// File: StationMapActivity.java
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Interactive OSMDroid map plotting nearby microgrid nodes from stored coordinates with Google Maps navigation.
//              Bottom shows hubs horizontally; tapping a hub shows distance from user location.
//              Closest hub is selected by default. Distance card hides when hub detail
//              dialog opens and re-appears automatically when it closes.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
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
import org.osmdroid.views.overlay.Polyline;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/** OSMDroid map showing nearby solar microgrid stations as tap-able GPS markers. */
public class StationMapActivity extends AppCompatActivity {

    private MapView mapView;
    private View progressBar;
    private TextView tvStatus;
    private EditText etSearch;
    private View panelInfo;
    private TextView tvPanelName, tvPanelDetails;
    private android.widget.ImageView ivPanelBg;
    private Button btnReserveThis;
    private Button btnGoogleMaps;
    private View panelUserInfo;
    private TextView tvUserCoords;
    private TextView tvUserAddress;
    private String userAddress = "";
    /** Rotating hub backgrounds — index by station id hash so any hub count works. */
    private static final int[] PANEL_BG_ART = {
            R.drawable.bg1, R.drawable.bg2,
            R.drawable.bg4, R.drawable.bg5,
            R.drawable.main };

    // ── Bottom sheet: horizontal hubs + distance card ──
    private View bottomSheet;
    private View cardDistance;
    private TextView tvDestination;
    private TextView tvDistanceValue;
    private HorizontalScrollView hubsStripScroll;
    private LinearLayout layoutHubStrip;

    private SessionManager sessionManager;
    private String targetStationId;
    private final List<Marker> stationMarkers = new ArrayList<>();
    private Marker userInstallationMarker;
    private Polyline routeLine;
    private static final int LOCATION_PERMISSION_REQUEST = 1001;

    // Cached hub payloads for bottom strip + distance math
    private final List<JSONObject> hubStations = new ArrayList<>();
    private double userLat = 0;
    private double userLng = 0;
    private boolean hasUserLoc = false;
    private String selectedStationId = null;

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
        ivPanelBg = findViewById(R.id.iv_panel_bg);
        btnReserveThis = findViewById(R.id.btn_reserve_this);
        btnGoogleMaps  = findViewById(R.id.btn_open_google_maps);
        panelUserInfo = findViewById(R.id.panel_user_info);
        tvUserCoords = findViewById(R.id.tv_user_coords);
        tvUserAddress = findViewById(R.id.tv_user_address);
        View btnCloseUserPanel = findViewById(R.id.btn_close_user_panel);
        if (btnCloseUserPanel != null) {
            btnCloseUserPanel.setOnClickListener(v -> hideUserPanel());
        }

        // Bottom distance + hubs strip bindings
        bottomSheet = findViewById(R.id.bottom_map_sheet);
        cardDistance = findViewById(R.id.card_distance);
        tvDestination = findViewById(R.id.tv_destination);
        tvDistanceValue = findViewById(R.id.tv_distance_value);
        hubsStripScroll = findViewById(R.id.hubs_strip_scroll);
        layoutHubStrip = findViewById(R.id.layout_hub_strip);
        // Tapping the distance card opens the hub detail dialog for the selected hub
        if (cardDistance != null) {
            cardDistance.setOnClickListener(v -> {
                JSONObject st = findHub(selectedStationId);
                if (st == null) return;
                showStationPanel(st.optString("name"), st.optString("stationCode"),
                        st.optInt("availableBatterySlots"), st.optDouble("capacityKWh"),
                        st.optString("operationalSchedule"), st.optString("id"),
                        st.optDouble("latitude"), st.optDouble("longitude"));
            });
        }

        View btnClosePanel = findViewById(R.id.btn_close_panel);
        if (btnClosePanel != null && panelInfo != null) {
            // Closing hub details hides panel and restores distance card automatically
            btnClosePanel.setOnClickListener(v -> hideStationPanel());
        }

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
        String q = query == null ? "" : query.toLowerCase().trim();
        for (Marker m : stationMarkers) {
            String title = m.getTitle() == null ? "" : m.getTitle().toLowerCase();
            String snippet = m.getSnippet() == null ? "" : m.getSnippet().toLowerCase();
            boolean visible = q.isEmpty() || title.contains(q) || snippet.contains(q);
            if (visible) {
                if (!mapView.getOverlays().contains(m)) mapView.getOverlays().add(m);
            } else {
                mapView.getOverlays().remove(m);
            }
        }
        // Also filter bottom hub strip chips
        if (layoutHubStrip != null) {
            for (int i = 0; i < layoutHubStrip.getChildCount(); i++) {
                View chip = layoutHubStrip.getChildAt(i);
                Object tag = chip.getTag(R.id.tv_destination);
                String hay = tag == null ? "" : String.valueOf(tag).toLowerCase();
                chip.setVisibility(q.isEmpty() || hay.contains(q) ? View.VISIBLE : View.GONE);
            }
        }
        mapView.invalidate();
    }

    private void loadUserInstallationAndStations() {
        // Fetch prosumer installation GPS coordinates from API and pin user installation marker
        progressBar.setVisibility(View.VISIBLE);
        String nic = sessionManager.getNic();
        
        new Thread(() -> {
            double lat = 0, lng = 0;
            String address = "";
            try {
                Request userReq = ApiClient.buildAuthRequest(this, "users/" + nic).get().build();
                Response userRes = ApiClient.getClient().newCall(userReq).execute();
                if (userRes.isSuccessful() && userRes.body() != null) {
                    JSONObject user = new JSONObject(userRes.body().string());
                    lat = user.optDouble("installationLatitude", 0);
                    if (lat == 0) lat = user.optDouble("InstallationLatitude", 0);
                    lng = user.optDouble("installationLongitude", 0);
                    if (lng == 0) lng = user.optDouble("InstallationLongitude", 0);
                    address = user.optString("address", "");
                    if (address.isEmpty()) address = user.optString("Address", "");
                }
            } catch (Exception ignored) {}
            final double uLat = lat;
            final double uLng = lng;
            final String uAddr = address == null ? "" : address.trim();
            runOnUiThread(() -> {
                hasUserLoc = (uLat != 0 && uLng != 0);
                userLat = uLat;
                userLng = uLng;
                userAddress = uAddr;
                if (userInstallationMarker != null) {
                    mapView.getOverlays().remove(userInstallationMarker);
                    userInstallationMarker = null;
                }
                if (hasUserLoc) {
                    Marker uMarker = new Marker(mapView);
                    uMarker.setPosition(new GeoPoint(uLat, uLng));
                    uMarker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
                    uMarker.setTitle("My Installation");
                    uMarker.setSnippet("Your solar installation point");
                    Drawable homeIcon = ResourcesCompat.getDrawable(getResources(), R.drawable.ic_map_home, null);
                    if (homeIcon != null) {
                        uMarker.setIcon(homeIcon);
                    }
                    uMarker.setOnMarkerClickListener((m, mv) -> {
                        showUserPanel(uLat, uLng);
                        return true;
                    });
                    mapView.getOverlays().add(uMarker);
                    userInstallationMarker = uMarker;
                    if (targetStationId == null) {
                        mapView.getController().setCenter(new GeoPoint(uLat, uLng));
                        mapView.getController().setZoom(14.0);
                    }
                }
                mapView.invalidate();
            });
            loadStationMarkers();
        }).start();
    }

    private void loadStationMarkers() {
        // Fetch hubs via nearby-prosumer (sorted + distanceKm), fallback to active list.
        // Caches in SQLite, draws markers, builds bottom horizontal strip, selects closest by default.
        new Thread(() -> {
            try {
                String nic = sessionManager.getNic();
                JSONArray array = null;

                // 1) Preferred: distance-sorted nearby endpoint
                try {
                    Request nearReq = ApiClient.buildAuthRequest(this, "stations/nearby-prosumer/" + nic).get().build();
                    try (Response nearRes = ApiClient.getClient().newCall(nearReq).execute()) {
                        if (nearRes.isSuccessful() && nearRes.body() != null) {
                            String nearBody = nearRes.body().string();
                            try {
                                JSONObject root = new JSONObject(nearBody);
                                JSONArray arr = root.optJSONArray("stations");
                                if (arr != null) array = arr;
                                else array = new JSONArray(nearBody);
                            } catch (Exception e) {
                                array = new JSONArray(nearBody);
                            }
                        }
                    }
                } catch (Exception ignored) {}

                // 2) Fallback: all active stations
                if (array == null) {
                    Request request = ApiClient.buildAuthRequest(this, "stations?status=Active").get().build();
                    Response response = ApiClient.getClient().newCall(request).execute();
                    String body = response.body().string();
                    array = new JSONArray(body);
                }

                final JSONArray finalArray = array;
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    int foundCount = 0;
                    for (Marker marker : stationMarkers) {
                        mapView.getOverlays().remove(marker);
                    }
                    stationMarkers.clear();
                    hubStations.clear();
                    if (layoutHubStrip != null) layoutHubStrip.removeAllViews();

                    for (int i = 0; i < finalArray.length(); i++) {
                        try {
                            JSONObject station = finalArray.getJSONObject(i);
                            final String stationId = station.optString("id");
                            if (stationId.isEmpty()) continue;
                            if (targetStationId != null && !targetStationId.equals(stationId)) continue;

                            double lat = station.optDouble("latitude", Double.NaN);
                            double lng = station.optDouble("longitude", Double.NaN);
                            if (Double.isNaN(lat) || Double.isNaN(lng)) continue;
                            String name = station.optString("name", "Solar Hub");
                            String code = station.optString("stationCode", "");
                            int slots   = station.optInt("availableBatterySlots", 0);
                            double cap  = station.optDouble("capacityKWh", 0);
                            String schedule = station.optString("operationalSchedule", "");

                            // Distance: prefer backend distanceKm, else local haversine
                            double distKm = -1;
                            if (station.has("distanceKm") && !station.isNull("distanceKm")) {
                                distKm = station.optDouble("distanceKm", -1);
                            } else if (station.has("DistanceKm") && !station.isNull("DistanceKm")) {
                                distKm = station.optDouble("DistanceKm", -1);
                            }
                            if (distKm < 0 && hasUserLoc) {
                                distKm = haversineKm(userLat, userLng, lat, lng);
                            }
                            try {
                                station.put("_distKm", distKm);
                            } catch (Exception ignored) {}
                            hubStations.add(station);

                            new DatabaseHelper(StationMapActivity.this).cacheSolarStation(
                                    stationId, code, name, station.optString("location"), lat, lng, cap,
                                    slots, station.optInt("totalBatterySlots"), schedule, station.optString("status"));

                            Marker marker = new Marker(mapView);
                            marker.setPosition(new GeoPoint(lat, lng));
                            marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
                            marker.setTitle(name + (code.isEmpty() ? "" : " [" + code + "]"));
                            marker.setSnippet(slots + " battery slots free | " + cap + " kWh | " + schedule);
                            Drawable hubIcon = ResourcesCompat.getDrawable(getResources(), R.drawable.ic_map_hub, null);
                            if (hubIcon != null) {
                                marker.setIcon(hubIcon);
                            }
                            final JSONObject tagStation = station;
                            marker.setOnMarkerClickListener((m, mv) -> {
                                selectHub(tagStation.optString("id"), false);
                                showStationPanel(name, code, slots, cap, schedule, stationId, lat, lng);
                                return true;
                            });

                            mapView.getOverlays().add(marker);
                            stationMarkers.add(marker);
                            foundCount++;

                            cacheStationSlots(stationId);
                        } catch (Exception ignored) {}
                    }

                    // Sort closest-first when user location is known
                    if (hasUserLoc) {
                        Collections.sort(hubStations, Comparator.comparingDouble(a -> a.optDouble("_distKm", Double.MAX_VALUE)));
                    }

                    renderHubStrip();

                    if (targetStationId != null) tvStatus.setText("Focusing on selected station");
                    else tvStatus.setText(foundCount + " solar hubs found");

                    mapView.invalidate();

                    // Default: show closest hub distance (or targeted hub)
                    if (!hubStations.isEmpty()) {
                        JSONObject def = null;
                        if (targetStationId != null) {
                            for (JSONObject s : hubStations) {
                                if (targetStationId.equals(s.optString("id"))) { def = s; break; }
                            }
                        }
                        if (def == null) def = hubStations.get(0);
                        selectHub(def.optString("id"), true);
                        if (targetStationId != null) {
                            double la = def.optDouble("latitude");
                            double ln = def.optDouble("longitude");
                            mapView.getController().setCenter(new GeoPoint(la, ln));
                            mapView.getController().setZoom(16.0);
                            showStationPanel(def.optString("name"), def.optString("stationCode"),
                                    def.optInt("availableBatterySlots"), def.optDouble("capacityKWh"),
                                    def.optString("operationalSchedule"), def.optString("id"), la, ln);
                        } else if (bottomSheet != null) {
                            // Keep details dialog closed by default; distance card visible
                            bottomSheet.setVisibility(View.VISIBLE);
                            if (panelInfo != null) panelInfo.setVisibility(View.GONE);
                        }
                    } else if (bottomSheet != null) {
                        bottomSheet.setVisibility(View.GONE);
                    }
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    tvStatus.setText("Failed to load stations.");
                });
            }
        }).start();
    }

    // ── Bottom horizontal hubs strip ─────────────────────────────────────
    private void renderHubStrip() {
        if (layoutHubStrip == null) return;
        layoutHubStrip.removeAllViews();
        for (int i = 0; i < hubStations.size(); i++) {
            final JSONObject st = hubStations.get(i);
            final String stationId = st.optString("id");
            String name = st.optString("name", "Solar Hub");
            String code = st.optString("stationCode", "");
            int avSlots = st.optInt("availableBatterySlots", 0);
            double distKm = st.optDouble("_distKm", -1);

            LinearLayout chip = new LinearLayout(this);
            chip.setOrientation(LinearLayout.VERTICAL);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dpToPx(150), LinearLayout.LayoutParams.WRAP_CONTENT);
            if (i < hubStations.size() - 1) lp.setMargins(0, 0, dpToPx(10), 0);
            chip.setLayoutParams(lp);
            chip.setClickable(true);
            chip.setFocusable(true);
            chip.setPadding(dpToPx(12), dpToPx(10), dpToPx(12), dpToPx(10));
            // Tag used for search filtering
            chip.setTag(R.id.tv_destination, name + " " + code);

            TextView tvName = new TextView(this);
            tvName.setText(name);
            tvName.setTextSize(13f);
            tvName.setTypeface(null, Typeface.BOLD);
            tvName.setMaxLines(1);
            tvName.setEllipsize(android.text.TextUtils.TruncateAt.END);
            chip.addView(tvName);

            TextView tvMeta = new TextView(this);
            String distTxt = distKm >= 0 ? formatDistance(distKm) : "—";
            tvMeta.setText(distTxt + " • " + avSlots + " slots");
            tvMeta.setTextSize(11f);
            tvMeta.setPadding(0, dpToPx(2), 0, 0);
            chip.addView(tvMeta);

            TextView tvCode = new TextView(this);
            tvCode.setText(code.isEmpty() ? "SOLAR HUB" : code);
            tvCode.setTextSize(10f);
            chip.addView(tvCode);

            chip.setTag(stationId);
            final int[] pos = { i };
            chip.setOnClickListener(v -> {
                selectHub(stationId, true);
                // Tapping a hub chip shows distance (does not auto-open detail dialog;
                // detail opens via marker tap or View-details button).
                if (panelInfo == null || panelInfo.getVisibility() != View.VISIBLE) {
                    if (bottomSheet != null) bottomSheet.setVisibility(View.VISIBLE);
                    if (cardDistance != null) cardDistance.setVisibility(View.VISIBLE);
                }
            });
            layoutHubStrip.addView(chip);
        }
        paintHubSelection();
    }

    private void paintHubSelection() {
        if (layoutHubStrip == null) return;
        for (int i = 0; i < layoutHubStrip.getChildCount(); i++) {
            View chip = layoutHubStrip.getChildAt(i);
            Object tag = chip.getTag();
            boolean sel = tag != null && tag.equals(selectedStationId);
            try {
                chip.setBackgroundResource(sel ? R.drawable.bg_hub_cta_dark : R.drawable.bg_neuro_card);
            } catch (Exception ignored) {}
            // Recolor texts for contrast
            if (chip instanceof LinearLayout) {
                LinearLayout ll = (LinearLayout) chip;
                for (int c = 0; c < ll.getChildCount(); c++) {
                    View tv = ll.getChildAt(c);
                    if (tv instanceof TextView) {
                        try {
                            ((TextView) tv).setTextColor(getResources().getColor(
                                    sel ? R.color.white : R.color.neuro_text_primary));
                        } catch (Exception e) {
                            ((TextView) tv).setTextColor(sel ? Color.WHITE : Color.parseColor("#1E293B"));
                        }
                    }
                }
            }
            chip.setElevation(sel ? dpToPx(4) : dpToPx(1));
        }
    }

    private JSONObject findHub(String stationId) {
        if (stationId == null) return null;
        for (JSONObject s : hubStations) {
            if (stationId.equals(s.optString("id"))) return s;
        }
        return null;
    }

    /** Select hub: highlight strip, update distance card, draw route, optionally center map. */
    private void selectHub(String stationId, boolean centerMap) {
        JSONObject st = findHub(stationId);
        if (st == null) return;
        selectedStationId = stationId;
        paintHubSelection();
        updateDistanceCard(st);
        double lat = st.optDouble("latitude");
        double lng = st.optDouble("longitude");
        if (centerMap) {
            try {
                mapView.getController().setCenter(new GeoPoint(lat, lng));
                if (mapView.getZoomLevelDouble() < 12) mapView.getController().setZoom(14.0);
            } catch (Exception ignored) {}
        }
        drawRoute(lat, lng);
        // Scroll selected chip into view
        if (layoutHubStrip != null && hubsStripScroll != null) {
            for (int i = 0; i < layoutHubStrip.getChildCount(); i++) {
                View chip = layoutHubStrip.getChildAt(i);
                if (stationId.equals(String.valueOf(chip.getTag()))) {
                    final int x = chip.getLeft() - dpToPx(12);
                    hubsStripScroll.smoothScrollTo(Math.max(0, x), 0);
                    break;
                }
            }
        }
        if (bottomSheet != null && (panelInfo == null || panelInfo.getVisibility() != View.VISIBLE)) {
            bottomSheet.setVisibility(View.VISIBLE);
        }
        mapView.invalidate();
    }

    /** Fill the bottom distance component: origin -> hub + distance. */
    private void updateDistanceCard(JSONObject st) {
        if (tvDestination == null) return;
        String name = st.optString("name", "Solar Hub");
        String code = st.optString("stationCode", "");
        tvDestination.setText(code.isEmpty() ? name : name + " [" + code + "]");

        double distKm = st.optDouble("_distKm", -1);
        if (distKm < 0 && hasUserLoc) {
            distKm = haversineKm(userLat, userLng, st.optDouble("latitude"), st.optDouble("longitude"));
            try { st.put("_distKm", distKm); } catch (Exception ignored) {}
        }
        if (distKm >= 0) {
            if (tvDistanceValue != null) tvDistanceValue.setText(formatDistance(distKm));
        } else {
            if (tvDistanceValue != null) tvDistanceValue.setText("—");
        }
        if (cardDistance != null) cardDistance.setVisibility(View.VISIBLE);
    }

    /** Thin dashed route line from your location to the selected hub. */
    private void drawRoute(double hubLat, double hubLng) {
        try {
            if (routeLine != null) {
                mapView.getOverlays().remove(routeLine);
                routeLine = null;
            }
            if (!hasUserLoc) return;
            Polyline line = new Polyline();
            List<GeoPoint> pts = new ArrayList<>();
            pts.add(new GeoPoint(userLat, userLng));
            pts.add(new GeoPoint(hubLat, hubLng));
            line.setPoints(pts);
            try {
                line.getOutlinePaint().setColor(Color.parseColor("#063127"));
            } catch (Exception e) {
                line.getOutlinePaint().setColor(Color.parseColor("#3B796A"));
            }
            float density = getResources().getDisplayMetrics().density;
            line.getOutlinePaint().setStrokeWidth(Math.max(2f, 3f * density / 2.5f));
            line.getOutlinePaint().setAntiAlias(true);
            line.getOutlinePaint().setStrokeCap(android.graphics.Paint.Cap.ROUND);
            line.getOutlinePaint().setPathEffect(
                    new android.graphics.DashPathEffect(
                            new float[]{10f * density, 7f * density}, 0f));
            mapView.getOverlays().add(line);
            routeLine = line;
        } catch (Exception ignored) {}
    }

    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 100.0) / 100.0;
    }

    private static String formatDistance(double km) {
        if (km < 0) return "—";
        if (km < 1) {
            int m = (int) Math.round(km * 1000);
            return m + " m";
        }
        if (km < 10) return String.format(Locale.getDefault(), "%.1f km", km);
        return String.format(Locale.getDefault(), "%.0f km", km);
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
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
        // Display photo-card panel; rotate bg per hub via id hash (works for any hub count)
        if (ivPanelBg != null) {
            try {
                int pick = Math.abs((stationId != null ? stationId : name).hashCode()) % PANEL_BG_ART.length;
                ivPanelBg.setImageResource(PANEL_BG_ART[pick]);
            } catch (Exception ignored) {}
        }
        tvPanelName.setText(name + (code == null || code.isEmpty() ? "" : " [" + code + "]"));
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

        // Opening hub details hides the distance card; it returns when details close
        if (bottomSheet != null) bottomSheet.setVisibility(View.GONE);
        hideUserPanel();
        panelInfo.setVisibility(View.VISIBLE);
    }

    private void hideStationPanel() {
        if (panelInfo != null) panelInfo.setVisibility(View.GONE);
        // Re-show distance for the currently selected hub automatically
        if (selectedStationId != null) {
            JSONObject st = findHub(selectedStationId);
            if (st != null) updateDistanceCard(st);
        }
        if (bottomSheet != null) bottomSheet.setVisibility(View.VISIBLE);
    }

    /** Beautiful bottom card for the user's own installation pin. */
    private void showUserPanel(double lat, double lng) {
        if (tvUserCoords != null) {
            tvUserCoords.setText(String.format(Locale.getDefault(),
                    "Lat %.5f  •  Lng %.5f", lat, lng));
        }
        if (tvUserAddress != null) {
            if (userAddress != null && !userAddress.isEmpty()) {
                tvUserAddress.setText(userAddress);
            } else {
                tvUserAddress.setText("Locating address…");
                reverseGeocodeAddress(lat, lng);
            }
        }
        if (panelInfo != null) panelInfo.setVisibility(View.GONE);
        if (panelUserInfo != null) {
            panelUserInfo.setVisibility(View.VISIBLE);
            panelUserInfo.bringToFront();
        }
    }

    /** Reverse-geocode installation coords when profile address is not set. */
    private void reverseGeocodeAddress(double lat, double lng) {
        new Thread(() -> {
            String resolved = "";
            try {
                android.location.Geocoder geocoder =
                        new android.location.Geocoder(this, Locale.getDefault());
                java.util.List<android.location.Address> results =
                        geocoder.getFromLocation(lat, lng, 1);
                if (results != null && !results.isEmpty()
                        && results.get(0).getAddressLine(0) != null) {
                    resolved = results.get(0).getAddressLine(0);
                }
            } catch (Exception ignored) {}
            final String finalResolved = resolved;
            runOnUiThread(() -> {
                if (tvUserAddress == null) return;
                if (!finalResolved.isEmpty()) {
                    tvUserAddress.setText(finalResolved);
                } else {
                    tvUserAddress.setText("Address not set – update it in Profile");
                }
            });
        }).start();
    }

    private void hideUserPanel() {
        if (panelUserInfo != null) panelUserInfo.setVisibility(View.GONE);
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
