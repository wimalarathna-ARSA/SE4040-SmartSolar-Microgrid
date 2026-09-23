// ============================================================================
// File: ProsumerMainActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Prosumer main dashboard displaying real-time generation, live API stats, and nearby microgrid nodes.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.SessionManager;
import com.smartsolar.mobile.ui.auth.LoginActivity;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;
import okhttp3.Request;
import okhttp3.Response;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * Prosumer dashboard — Glassmorphic light UI.
 * All text sourced from strings.xml (no hardcoded literals).
 * Live stats from GET /api/reservations/dashboard-stats.
 * Nearby nodes from GET /api/stations/nearby-prosumer/{nic}.
 */
public class ProsumerMainActivity extends AppCompatActivity {

    // ── Slot stat views ──────────────────────────────────────────────────────
    private TextView tvActiveCount;
    private TextView tvPendingCount;
    private TextView tvApprovedFuture;
    private TextView tvCompletedCount;

    // ── Energy Chart ─────────────────────────────────────────────────────────
    private LineChart lineChart;

    // ── Nearby Nodes views ───────────────────────────────────────────────────
    private LinearLayout layoutNearbyNodes;
    private LinearLayout layoutNoGpsNotice;
    private View  progressNearby;

    // ── Progress + session ───────────────────────────────────────────────────
    private View progressBar;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Initialise session, bind views, set time-sensitive greeting, wire nav buttons, and trigger data fetches
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_prosumer_main);
        sessionManager = new SessionManager(this);
        bindViews();
        setGreeting();
        wireNavigation();
        applyEntranceMotion();
        loadDashboardStats();
        loadEnergyTransferHistory(); 
        loadNearbyNodes();          // << NEW: load nearby microgrid nodes
    }

    // ── Bind all views ───────────────────────────────────────────────────────
    private void bindViews() {
        // Locate and map all slot counters, LineChart, layout containers and progress indicator references
        tvActiveCount     = findViewById(R.id.tv_active_count);
        tvPendingCount    = findViewById(R.id.tv_pending_count);
        tvApprovedFuture  = findViewById(R.id.tv_approved_future);
        tvCompletedCount  = findViewById(R.id.tv_completed_count);
        lineChart         = findViewById(R.id.energy_line_chart);
        progressBar       = findViewById(R.id.progress_bar);
        layoutNearbyNodes = findViewById(R.id.layout_nearby_nodes);
        layoutNoGpsNotice = findViewById(R.id.layout_no_gps_notice);
        progressNearby    = findViewById(R.id.progress_nearby);
    }

    // ── Time-sensitive greeting ──────────────────────────────────────────────
    private void setGreeting() {
        // Evaluate current hour of day to render personalised Morning, Afternoon or Evening greeting
        TextView tvGreeting = findViewById(R.id.tv_greeting);
        if (tvGreeting == null) return;
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        String period = hour < 12 ? getString(R.string.greeting_morning)
                      : hour < 17 ? getString(R.string.greeting_afternoon)
                      :             getString(R.string.greeting_evening);
        String name = sessionManager.getFullName();
        tvGreeting.setText(getString(R.string.greeting_format, period, name));
    }

    // ── Wire all click listeners ─────────────────────────────────────────────
    private void wireNavigation() {
        // Attach click listeners to bottom navigation bar items and quick action dashboard buttons
        // Bottom nav
        setClick(R.id.nav_bookings,    BookingHistoryActivity.class);
        setClick(R.id.nav_new_booking, CreateReservationActivity.class);
        setClick(R.id.nav_map,         StationMapActivity.class);
        setClick(R.id.nav_profile,     ProfileActivity.class);

        // Quick action buttons
        setClick(R.id.btn_analytics,   AnalyticsActivity.class);
        setClick(R.id.btn_transfers,   EnergyTransferHistoryActivity.class);

        View btnSettings = findViewById(R.id.btn_settings);
        if (btnSettings != null) {
            btnSettings.setOnClickListener(v -> startActivity(new Intent(this, SettingsActivity.class)));
        }
    }

    private void setClick(int viewId, Class<?> target) {
        // Convenience helper to attach an explicit navigation Intent to a given view resource ID
        View v = findViewById(viewId);
        if (v != null) v.setOnClickListener(x ->
                startActivity(new Intent(this, target)));
    }

    // ── Load live stats from API ─────────────────────────────────────────────
    private void loadDashboardStats() {
        // Fetch live reservation metrics for active, pending, approved, and completed states from API
        if (progressBar != null) progressBar.setVisibility(View.VISIBLE);
        String nic = sessionManager.getNic();

        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this,
                        "reservations/dashboard-stats?prosumerNic=" + nic)
                        .get().build();

                try (Response response = ApiClient.getClient().newCall(request).execute()) {
                    if (response.body() == null) { hideProgress(); return; }

                    JSONObject json = new JSONObject(response.body().string());

                    int active    = json.optInt("activeReservationsCount", 0);
                    int pending   = json.optInt("pendingReservationsCount", 0);
                    int future    = json.optInt("countOfApprovedFutureReservations", 0);
                    int completed = json.optInt("completedReservationsCount", 0);

                    runOnUiThread(() -> {
                        hideProgress();
                        tvActiveCount.setText(String.valueOf(active));
                        tvPendingCount.setText(String.valueOf(pending));
                        tvApprovedFuture.setText(String.valueOf(future));
                        tvCompletedCount.setText(String.valueOf(completed));
                    });
                }
            } catch (Exception e) {
                hideProgress();
            }
        }).start();
    }

    // ── Load energy transfer history for the Line Chart ──────────────────────
    private void loadEnergyTransferHistory() {
        // Pull completed energy transfers from API and build chronological daily aggregation dataset
        if (lineChart == null) return;
        String nic = sessionManager.getNic();

        new Thread(() -> {
            try {
                String url = "reservations?prosumerNic=" + nic + "&status=Completed";
                Request request = ApiClient.buildAuthRequest(this, url).get().build();
                try (Response response = ApiClient.getClient().newCall(request).execute()) {
                    if (response.body() != null) {
                        JSONArray array = new JSONArray(response.body().string());
                        Map<String, Float> dailyEnergy = new TreeMap<>();
                        
                        for (int i = 0; i < array.length(); i++) {
                            JSONObject item = array.getJSONObject(i);
                            String isoDate = item.optString("scheduledDateTime");
                            if (isoDate.length() >= 10) {
                                String dateKey = isoDate.substring(0, 10);
                                float energy = (float) item.optDouble("energyAmountKWh", 0);
                                dailyEnergy.put(dateKey, dailyEnergy.getOrDefault(dateKey, 0f) + energy);
                            }
                        }

                        List<Entry> entries = new ArrayList<>();
                        List<String> dates = new ArrayList<>();
                        int index = 0;
                        for (Map.Entry<String, Float> entry : dailyEnergy.entrySet()) {
                            entries.add(new Entry(index, entry.getValue()));
                            dates.add(entry.getKey().substring(5)); // MM-DD
                            index++;
                        }
                        runOnUiThread(() -> setupLineChart(entries, dates));
                    }
                }
            } catch (Exception ignored) {}
        }).start();
    }

    private void setupLineChart(List<Entry> entries, List<String> dates) {
        // Configure MPAndroidChart LineChart styling, cubic bezier curve, axes and data binding
        if (entries.isEmpty()) {
            lineChart.setNoDataText("No transfer history available yet.");
            lineChart.setNoDataTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
            lineChart.invalidate();
            return;
        }

        LineDataSet dataSet = new LineDataSet(entries, "Energy (kWh)");
        dataSet.setColor(ContextCompat.getColor(this, R.color.neuro_green));
        dataSet.setValueTextColor(ContextCompat.getColor(this, R.color.neuro_text_primary));
        dataSet.setLineWidth(2.5f);
        dataSet.setCircleRadius(3f);
        dataSet.setCircleColor(ContextCompat.getColor(this, R.color.neuro_green));
        dataSet.setCircleHoleColor(ContextCompat.getColor(this, R.color.white));
        dataSet.setDrawFilled(true);
        dataSet.setFillColor(ContextCompat.getColor(this, R.color.neuro_green));
        dataSet.setFillAlpha(28);
        dataSet.setMode(LineDataSet.Mode.CUBIC_BEZIER);
        dataSet.setDrawValues(false);

        LineData lineData = new LineData(dataSet);
        lineChart.setData(lineData);
        
        lineChart.getDescription().setEnabled(false);
        lineChart.getLegend().setEnabled(false);

        XAxis xAxis = lineChart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setGranularity(1f);
        xAxis.setValueFormatter(new IndexAxisValueFormatter(dates));
        xAxis.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));

        lineChart.getAxisLeft().setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
        lineChart.getAxisLeft().setDrawGridLines(true);
        lineChart.getAxisLeft().setGridColor(ContextCompat.getColor(this, R.color.neuro_shadow_light));
        lineChart.getAxisRight().setEnabled(false);
        
        lineChart.animateX(800);
        lineChart.invalidate();
    }

    // ── Load nearby microgrid nodes sorted by distance from installation GPS ──
    private void loadNearbyNodes() {
        // Fetch microgrid nodes sorted by Haversine distance relative to prosumer installation GPS
        if (progressNearby != null) progressNearby.setVisibility(View.VISIBLE);
        String nic = sessionManager.getNic();

        new Thread(() -> {
            try {
                // Uses stored InstallationLatitude/Longitude from the prosumer's profile
                // Backend computes Haversine distance and sorts ascending
                Request request = ApiClient.buildAuthRequest(this,
                        "stations/nearby-prosumer/" + nic).get().build();

                try (Response response = ApiClient.getClient().newCall(request).execute()) {
                    if (response.body() == null) { hideNearbyProgress(); return; }
                    String bodyStr = response.body().string();
                    JSONObject root = new JSONObject(bodyStr);
                    String message  = root.optString("message", "");
                    JSONArray stationsArr = root.optJSONArray("stations");

                    boolean noGps = message.contains("No installation coordinates");

                    runOnUiThread(() -> {
                        hideNearbyProgress();
                        if (layoutNearbyNodes == null) return;
                        layoutNearbyNodes.removeAllViews();

                        // Show advisory if no GPS set
                        if (layoutNoGpsNotice != null) {
                            layoutNoGpsNotice.setVisibility(noGps ? View.VISIBLE : View.GONE);
                        }

                        if (stationsArr == null || stationsArr.length() == 0) {
                            renderNearbyEmptyState("No active microgrid nodes found nearby.");
                            return;
                        }

                        // Render up to 5 nearby hub cards
                        int count = Math.min(stationsArr.length(), 5);
                        for (int i = 0; i < count; i++) {
                            try {
                                JSONObject st = stationsArr.getJSONObject(i);
                                renderNearbyHubCard(st, i + 1);
                            } catch (Exception ignored) {}
                        }

                        // "View All" button that navigates to the map
                        if (stationsArr.length() > 0) {
                            renderViewAllButton();
                        }
                    });
                }
            } catch (Exception e) {
                hideNearbyProgress();
            }
        }).start();
    }

    // ── Render a single nearby hub card (professional, structured, no neon) ───
    private void renderNearbyHubCard(JSONObject st, int rank) {
        // Inflate and render a structured card view for a nearby microgrid hub with slot meter
        if (layoutNearbyNodes == null) return;

        String name     = st.optString("name", "Microgrid Hub");
        String location = st.optString("location", "Location unavailable");
        String status   = st.optString("status", "Active");
        double distKm   = st.optDouble("distanceKm", -1);
        int    avSlots  = st.optInt("availableBatterySlots", 0);
        int    totSlots = st.optInt("totalBatterySlots", 0);
        boolean hasSlots = avSlots > 0;
        boolean isActive = "Active".equalsIgnoreCase(status);

        int inkPrimary, inkSecondary, inkMuted, chipBg, chipStroke, statusBg, statusInk;
        try {
            inkPrimary   = getResources().getColor(R.color.neuro_text_primary);
            inkSecondary = getResources().getColor(R.color.neuro_text_secondary);
            inkMuted     = getResources().getColor(R.color.neuro_text_muted);
            statusBg     = getResources().getColor(isActive ? R.color.neuro_green_bg : R.color.neuro_amber_bg);
            statusInk    = getResources().getColor(isActive ? R.color.neuro_text_green : R.color.neuro_amber);
        } catch (Exception e) {
            inkPrimary = Color.parseColor("#1E293B");
            inkSecondary = Color.parseColor("#475569");
            inkMuted = Color.parseColor("#94A3B8");
            statusBg = Color.parseColor(isActive ? "#E3EDE6" : "#EFE8D2");
            statusInk = Color.parseColor(isActive ? "#2F6B4F" : "#7A6514");
        }
        chipBg = Color.parseColor("#F1F5F9");

        // Card container
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        cardParams.setMargins(0, 0, 0, dpToPx(10));
        card.setLayoutParams(cardParams);
        card.setPadding(dpToPx(12), dpToPx(12), dpToPx(14), dpToPx(12));
        card.setClickable(true);
        card.setFocusable(true);
        try {
            card.setBackgroundResource(R.drawable.bg_neuro_inner_card);
        } catch (Exception ignored) {}

        // Thumbnail: professional solar-house photo, cycles 1..5 by rank.
        // Drop house_solar_1.png … house_solar_5.png into drawable-nodpi/
        // (delete the .xml placeholders) for the final photography.
        FrameLayout thumbBox = new FrameLayout(this);
        LinearLayout.LayoutParams thumbParams = new LinearLayout.LayoutParams(dpToPx(76), dpToPx(76));
        thumbParams.setMargins(0, 0, dpToPx(12), 0);
        thumbBox.setLayoutParams(thumbParams);
        try { thumbBox.setBackgroundResource(R.drawable.bg_thumb_photo); }
        catch (Exception ignored) { thumbBox.setBackgroundColor(Color.parseColor("#E8EDF2")); }

        ImageView thumb = new ImageView(this);
        thumb.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        thumb.setScaleType(ImageView.ScaleType.CENTER_CROP);
        int[] houseArt = {
                R.drawable.house_solar_1, R.drawable.house_solar_2,
                R.drawable.house_solar_3, R.drawable.house_solar_4,
                R.drawable.house_solar_5 };
        try { thumb.setImageResource(houseArt[(rank - 1) % houseArt.length]); }
        catch (Exception ignored) {}
        thumbBox.addView(thumb);

        TextView tvRankChip = new TextView(this);
        tvRankChip.setText(String.format(Locale.getDefault(), "%02d", rank));
        tvRankChip.setTextSize(9f);
        tvRankChip.setTypeface(null, Typeface.BOLD);
        tvRankChip.setTextColor(Color.WHITE);
        tvRankChip.setGravity(Gravity.CENTER);
        FrameLayout.LayoutParams chipParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT);
        chipParams.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        chipParams.setMargins(0, 0, 0, dpToPx(4));
        tvRankChip.setLayoutParams(chipParams);
        tvRankChip.setPadding(dpToPx(6), dpToPx(1), dpToPx(6), dpToPx(1));
        try { tvRankChip.setBackgroundResource(R.drawable.bg_status_chip); }
        catch (Exception ignored) { tvRankChip.setBackgroundColor(Color.parseColor("#CC1E293B")); }
        thumbBox.addView(tvRankChip);
        card.addView(thumbBox);

        // Right column: title block + divider + meter row
        LinearLayout body = new LinearLayout(this);
        body.setOrientation(LinearLayout.VERTICAL);
        body.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        card.addView(body);

        // Row 1: title block + distance
        LinearLayout row1 = new LinearLayout(this);
        row1.setOrientation(LinearLayout.HORIZONTAL);
        row1.setGravity(Gravity.CENTER_VERTICAL);
        row1.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        LinearLayout nameCol = new LinearLayout(this);
        nameCol.setOrientation(LinearLayout.VERTICAL);
        nameCol.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView tvName = new TextView(this);
        tvName.setText(name);
        tvName.setTextSize(14f);
        tvName.setTypeface(null, Typeface.BOLD);
        tvName.setTextColor(inkPrimary);
        tvName.setMaxLines(1);
        tvName.setEllipsize(android.text.TextUtils.TruncateAt.END);

        TextView tvLoc = new TextView(this);
        tvLoc.setText(location);
        tvLoc.setTextSize(12f);
        tvLoc.setTextColor(inkSecondary);
        tvLoc.setMaxLines(1);
        tvLoc.setEllipsize(android.text.TextUtils.TruncateAt.END);

        nameCol.addView(tvName);
        nameCol.addView(tvLoc);

        TextView tvDist = new TextView(this);
        tvDist.setText(distKm >= 0
                ? String.format(Locale.getDefault(), "%.1f km", distKm)
                : "Distance N/A");
        tvDist.setTextSize(11f);
        tvDist.setTypeface(null, Typeface.BOLD);
        tvDist.setTextColor(inkSecondary);
        tvDist.setPadding(dpToPx(8), dpToPx(4), dpToPx(8), dpToPx(4));
        try { tvDist.setBackgroundResource(R.drawable.bg_status_chip); }
        catch (Exception ignored) { tvDist.setBackgroundColor(chipBg); }

        row1.addView(nameCol);
        row1.addView(tvDist);
        body.addView(row1);

        // Divider
        View divider = new View(this);
        LinearLayout.LayoutParams divParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(1));
        divParams.setMargins(0, dpToPx(10), 0, dpToPx(10));
        divider.setLayoutParams(divParams);
        try { divider.setBackgroundColor(getResources().getColor(R.color.glass_divider)); }
        catch (Exception e) { divider.setBackgroundColor(Color.parseColor("#E8EDF2")); }
        body.addView(divider);

        // Row 2: availability meter + status chip
        LinearLayout row2 = new LinearLayout(this);
        row2.setOrientation(LinearLayout.HORIZONTAL);
        row2.setGravity(Gravity.CENTER_VERTICAL);
        row2.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        LinearLayout slotsCol = new LinearLayout(this);
        slotsCol.setOrientation(LinearLayout.VERTICAL);
        slotsCol.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView tvSlots = new TextView(this);
        tvSlots.setText("Available slots  " + avSlots + " / " + totSlots);
        tvSlots.setTextSize(12f);
        tvSlots.setTextColor(hasSlots ? inkPrimary : inkMuted);

        ProgressBar meter = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        LinearLayout.LayoutParams meterParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(5));
        meterParams.setMargins(0, dpToPx(6), dpToPx(12), 0);
        meter.setLayoutParams(meterParams);
        meter.setMax(Math.max(totSlots, 1));
        meter.setProgress(Math.min(avSlots, Math.max(totSlots, 1)));
        meter.setProgressTintList(android.content.res.ColorStateList.valueOf(
                hasSlots ? statusInk : inkMuted));
        meter.setProgressBackgroundTintList(android.content.res.ColorStateList.valueOf(
                Color.parseColor("#E8EDF2")));

        slotsCol.addView(tvSlots);
        slotsCol.addView(meter);

        TextView tvStatus = new TextView(this);
        tvStatus.setText(isActive ? "ACTIVE" : status.toUpperCase(Locale.getDefault()));
        tvStatus.setTextSize(10f);
        tvStatus.setTypeface(null, Typeface.BOLD);
        tvStatus.setTextColor(statusInk);
        tvStatus.setBackgroundColor(statusBg);
        tvStatus.setPadding(dpToPx(10), dpToPx(5), dpToPx(10), dpToPx(5));

        row2.addView(slotsCol);
        row2.addView(tvStatus);
        body.addView(row2);

        // Subtle press feedback
        card.setOnTouchListener((v, event) -> {
            if (event.getAction() == android.view.MotionEvent.ACTION_DOWN) {
                v.animate().scaleX(0.985f).scaleY(0.985f).setDuration(90).start();
            } else if (event.getAction() == android.view.MotionEvent.ACTION_UP
                    || event.getAction() == android.view.MotionEvent.ACTION_CANCEL) {
                v.animate().scaleX(1f).scaleY(1f).setDuration(160).start();
            }
            return false;
        });

        // Tap card → open map showing ONLY this node and user's installation address
        String stationId = st.optString("id");
        card.setOnClickListener(v -> {
            Intent intent = new Intent(this, StationMapActivity.class);
            intent.putExtra("target_station_id", stationId);
            startActivity(intent);
        });

        // Staggered entrance motion
        card.setAlpha(0f);
        card.setTranslationY(dpToPx(14));
        card.animate().alpha(1f).translationY(0f)
                .setDuration(320)
                .setStartDelay(Math.min(rank, 5) * 70L)
                .start();

        layoutNearbyNodes.addView(card);
    }

    // ── Render structured empty state with illustration ──────────────────────
    private void renderNearbyEmptyState(String msg) {
        // Render styled placeholder view when no nearby microgrid nodes are reported within range
        if (layoutNearbyNodes == null) return;
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL);
        box.setPadding(dpToPx(20), dpToPx(20), dpToPx(20), dpToPx(20));
        try { box.setBackgroundResource(R.drawable.bg_neuro_inner_card); }
        catch (Exception ignored) {}

        ImageView illus = new ImageView(this);
        try { illus.setImageResource(R.drawable.illus_empty_nodes); }
        catch (Exception ignored) {}
        LinearLayout.LayoutParams illusParams = new LinearLayout.LayoutParams(dpToPx(160), dpToPx(110));
        illusParams.setMargins(0, 0, 0, dpToPx(12));
        illus.setLayoutParams(illusParams);
        box.addView(illus);

        TextView tvTitle = new TextView(this);
        tvTitle.setText("No nearby hubs found");
        tvTitle.setTextSize(14f);
        tvTitle.setTypeface(null, Typeface.BOLD);
        tvTitle.setGravity(Gravity.CENTER);
        try { tvTitle.setTextColor(getResources().getColor(R.color.neuro_text_primary)); }
        catch (Exception ignored) {}
        box.addView(tvTitle);

        TextView tv = new TextView(this);
        tv.setText(msg);
        tv.setTextSize(12f);
        tv.setGravity(Gravity.CENTER);
        try { tv.setTextColor(getResources().getColor(R.color.neuro_text_secondary)); }
        catch (Exception ignored) {}
        box.addView(tv);

        box.setAlpha(0f);
        box.animate().alpha(1f).setDuration(300).start();
        layoutNearbyNodes.addView(box);
    }

    // ── "View All on Map" structured button ──────────────────────────────────
    private void renderViewAllButton() {
        // Append "View all on map" button linking directly to the full interactive station map
        if (layoutNearbyNodes == null) return;
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(48));
        params.setMargins(0, dpToPx(4), 0, 0);
        Button btn = new Button(this);
        btn.setText("View all on map");
        btn.setTextSize(13f);
        btn.setAllCaps(false);
        try {
            btn.setTextColor(getResources().getColor(R.color.white));
            btn.setBackgroundResource(R.drawable.bg_btn_primary);
        } catch (Exception e) {
            btn.setTextColor(Color.WHITE);
            btn.setBackgroundResource(R.drawable.bg_btn_primary);
        }
        btn.setTypeface(null, Typeface.BOLD);
        btn.setLayoutParams(params);
        btn.setOnClickListener(v -> startActivity(new Intent(this, StationMapActivity.class)));
        layoutNearbyNodes.addView(btn);
    }

    private void hideProgress() {
        // Safely dismiss main dashboard circular progress indicator on UI thread
        runOnUiThread(() -> { if (progressBar != null) progressBar.setVisibility(View.GONE); });
    }

    private void hideNearbyProgress() {
        // Safely dismiss nearby nodes section progress indicator on UI thread
        runOnUiThread(() -> { if (progressNearby != null) progressNearby.setVisibility(View.GONE); });
    }

    // ── Structured entrance motion for dashboard sections ────────────────────
    private void applyEntranceMotion() {
        // Apply staggered fade and slide animations to dashboard cards and nearby hubs container
        try {
            android.view.animation.Animation fade =
                    android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in);
            android.view.animation.Animation rise =
                    android.view.animation.AnimationUtils.loadAnimation(this, R.anim.slide_up);
            int[] fadeViews = { R.id.dashboard_banner, R.id.energy_card, R.id.slots_card };
            for (int i = 0; i < fadeViews.length; i++) {
                View v = findViewById(fadeViews[i]);
                if (v != null) {
                    v.setAnimation(i == 0 ? fade : rise);
                    v.animate().alpha(1f).setDuration(1).start();
                }
            }
            if (layoutNearbyNodes != null) {
                try {
                    android.view.animation.LayoutAnimationController ctrl =
                            android.view.animation.AnimationUtils.loadLayoutAnimation(this, R.anim.layout_fade_slide);
                    layoutNearbyNodes.setLayoutAnimation(ctrl);
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
    }

    // ── dp → px helper ───────────────────────────────────────────────────────
    private int dpToPx(int dp) {
        // Convert device-independent pixels to physical screen pixels using display metrics density
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    @Override
    protected void onResume() {
        // Refresh dashboard statistics, energy history graph, and nearby nodes on screen resume
        super.onResume();
        loadDashboardStats();
        loadEnergyTransferHistory();
        loadNearbyNodes();
    }
}
