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

    // ── Earnings summary ─────────────────────────────────────────────────────
    private TextView tvEarningsValue;
    private TextView tvEarningsDetail;

    // ── Nearby Nodes views ───────────────────────────────────────────────────
    private LinearLayout layoutNearbyNodes;
    private LinearLayout layoutNoGpsNotice;
    private View  progressNearby;

    // ── Upcoming booking views ───────────────────────────────────────────────
    private TextView tvUpcomingHub;
    private TextView tvUpcomingDate;
    private TextView tvUpcomingTime;
    private View btnShowAll;
    private View btnUpcomingDetails;
    private android.widget.HorizontalScrollView hubsScroll;
    private LinearLayout layoutWeekStrip;
    private String upcomingReservationId = null;
    private final java.util.Set<String> approvedDateKeys = new java.util.HashSet<>();

    // ── Notifications ────────────────────────────────────────────────────
    private View btnNotifications;
    private TextView tvNotifBadge;
    private View layoutNotifDropdown;
    private LinearLayout layoutNotifList;
    private TextView tvNotifEmpty;

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
        loadUpcomingBooking();
        wireNotifications();
        loadNotifications();
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
        tvUpcomingHub     = findViewById(R.id.tv_upcoming_hub);
        tvUpcomingDate    = findViewById(R.id.tv_upcoming_date);
        tvUpcomingTime    = findViewById(R.id.tv_upcoming_time);
        btnShowAll        = findViewById(R.id.btn_show_all);
        btnUpcomingDetails = findViewById(R.id.btn_upcoming_details);
        hubsScroll        = findViewById(R.id.hubs_scroll);
        layoutWeekStrip   = findViewById(R.id.layout_week_strip);
        tvEarningsValue   = findViewById(R.id.tv_earnings_value);
        tvEarningsDetail  = findViewById(R.id.tv_earnings_detail);
        btnNotifications  = findViewById(R.id.btn_notifications);
        tvNotifBadge      = findViewById(R.id.tv_notif_badge);
        layoutNotifDropdown = findViewById(R.id.layout_notif_dropdown);
        layoutNotifList   = findViewById(R.id.layout_notif_list);
        tvNotifEmpty      = findViewById(R.id.tv_notif_empty);
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
        // Bottom nav with sliding indicator motion
        setupBottomNavMotion();

        // Quick action buttons
        setClick(R.id.btn_analytics,   AnalyticsActivity.class);
        setClick(R.id.btn_transfers,   EnergyTransferHistoryActivity.class);

        if (btnShowAll != null) {
            btnShowAll.setOnClickListener(v -> startActivity(new Intent(this, BookingHistoryActivity.class)));
        }
        if (btnUpcomingDetails != null) {
            btnUpcomingDetails.setOnClickListener(v -> {
                if (upcomingReservationId == null) {
                    startActivity(new Intent(this, BookingHistoryActivity.class));
                    return;
                }
                Intent intent = new Intent(this, BookingDetailActivity.class);
                intent.putExtra("reservation_id", upcomingReservationId);
                startActivity(intent);
            });
        }

        View hubsPrev = findViewById(R.id.btn_hubs_prev);
        if (hubsPrev != null && hubsScroll != null) {
            hubsPrev.setOnClickListener(v -> hubsScroll.smoothScrollBy(-dpToPx(320), 0));
        }
        View hubsNext = findViewById(R.id.btn_hubs_next);
        if (hubsNext != null && hubsScroll != null) {
            hubsNext.setOnClickListener(v -> hubsScroll.smoothScrollBy(dpToPx(320), 0));
        }

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

    // ── Bottom nav: slow glide tint + scale motion ───────────────────────────
    private int navSelected = 0;
    private boolean navLeaving = false;
    private final int[] navItemIds = { R.id.nav_dashboard, R.id.nav_bookings, R.id.nav_map, R.id.nav_profile };
    private final int[] navIconIds = { R.id.ic_dashboard, R.id.ic_bookings, R.id.ic_map, R.id.ic_profile };

    private void setupBottomNavMotion() {
        int[] itemIds = navItemIds;
        int[] iconIds = navIconIds;
        Class<?>[] targets = { null, BookingHistoryActivity.class, StationMapActivity.class, ProfileActivity.class };

        paintNavIcons(iconIds, 0);

        for (int i = 0; i < itemIds.length; i++) {
            final int index = i;
            final View item = findViewById(itemIds[i]);
            final Class<?> target = targets[i];
            if (item == null) continue;
            item.setOnClickListener(v -> {
                if (navLeaving) return; // ignore taps while a destination is launching
                if (target == null) {
                    // Home tab: snap selection back to dashboard
                    animateNavSelection(iconIds, navSelected, 0);
                    navSelected = 0;
                    return;
                }
                animateNavSelection(iconIds, navSelected, index);
                navSelected = index;
                navLeaving = true;
                v.postDelayed(() -> startActivity(new Intent(this, target)), 750);
            });
        }

        View fab = findViewById(R.id.nav_new_booking);
        if (fab != null) {
            fab.setOnClickListener(v -> {
                v.animate().scaleX(0.9f).scaleY(0.9f).setDuration(120).withEndAction(() ->
                        v.animate().scaleX(1f).scaleY(1f).setDuration(220).start()).start();
                v.postDelayed(() ->
                        startActivity(new Intent(this, CreateReservationActivity.class)), 150);
            });
        }
    }

    /** Slowly glides tint + scale from previously selected icon to the tapped one. */
    private void animateNavSelection(int[] iconIds, int from, int to) {
        if (from == to) {
            View item = findViewById(iconIds.length > to ? iconIds[to] : 0);
            if (item != null) {
                item.animate().scaleX(1.15f).scaleY(1.15f).setDuration(180)
                        .withEndAction(() -> item.animate().scaleX(1f).scaleY(1f)
                                .setDuration(300).start()).start();
            }
            return;
        }
        int deepVal = Color.parseColor("#063127");
        int softVal = Color.parseColor("#65998B");
        try {
            deepVal = ContextCompat.getColor(this, R.color.text_brand);
            softVal = ContextCompat.getColor(this, R.color.chart_teal_300);
        } catch (Exception ignored) {}
        final int deep = deepVal;
        final int soft = softVal;

        android.widget.ImageView fromIv = findViewById(iconIds[from]);
        android.widget.ImageView toIv = findViewById(iconIds[to]);
        View toItem = null;
        int[] itemIds = { R.id.nav_dashboard, R.id.nav_bookings, R.id.nav_map, R.id.nav_profile };
        if (to >= 0 && to < itemIds.length) toItem = findViewById(itemIds[to]);
        final android.widget.ImageView ivFrom = fromIv;
        final android.widget.ImageView ivTo = toIv;
        final View itemTo = toItem;

        // Outgoing icon: slow fade tint deep -> soft + shrink
        if (ivFrom != null) {
            android.animation.ValueAnimator fadeOut =
                    android.animation.ValueAnimator.ofObject(new android.animation.ArgbEvaluator(), deep, soft);
            fadeOut.setDuration(900);
            fadeOut.setInterpolator(new android.view.animation.DecelerateInterpolator());
            fadeOut.addUpdateListener(a ->
                    ivFrom.setColorFilter((int) a.getAnimatedValue()));
            fadeOut.start();
            ivFrom.animate().scaleX(0.9f).scaleY(0.9f).alpha(0.85f).setDuration(900)
                    .withEndAction(() -> ivFrom.animate().scaleX(1f).scaleY(1f)
                            .setDuration(500).start()).start();
        }
        // Incoming icon: slow glide tint soft -> deep + grow
        if (ivTo != null) {
            android.animation.ValueAnimator fadeIn =
                    android.animation.ValueAnimator.ofObject(new android.animation.ArgbEvaluator(), soft, deep);
            fadeIn.setDuration(900);
            fadeIn.setStartDelay(120);
            fadeIn.setInterpolator(new android.view.animation.DecelerateInterpolator());
            fadeIn.addUpdateListener(a ->
                    ivTo.setColorFilter((int) a.getAnimatedValue()));
            fadeIn.start();
            ivTo.animate().scaleX(0.8f).scaleY(0.8f).setDuration(250).withEndAction(() ->
                    ivTo.animate().scaleX(1.15f).scaleY(1.15f).alpha(1f).setDuration(550)
                            .withEndAction(() -> ivTo.animate().scaleX(1f).scaleY(1f)
                                    .setDuration(500).start()).start()).start();
        }
        // Whole tab lifts slowly like a water bob
        if (itemTo != null) {
            itemTo.animate().translationY(-8f).setDuration(400).withEndAction(() ->
                    itemTo.animate().translationY(0f).setDuration(700).start()).start();
        }
    }

    private void paintNavIcons(int[] iconIds, int selected) {
        for (int i = 0; i < iconIds.length; i++) {
            android.widget.ImageView iv = findViewById(iconIds[i]);
            if (iv == null) continue;
            try {
                // Stop any in-flight glide animation so the reset state sticks
                iv.animate().cancel();
                iv.clearAnimation();
                if (i == selected) {
                    iv.setColorFilter(ContextCompat.getColor(this, R.color.text_brand));
                    iv.setAlpha(1f);
                } else {
                    iv.setColorFilter(ContextCompat.getColor(this, R.color.chart_teal_300));
                    iv.setAlpha(0.85f);
                }
            } catch (Exception ignored) {}
        }
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
                        float monthKwh = 0f;
                        int monthCount = 0;
                        String thisMonth = new SimpleDateFormat("yyyy-MM", Locale.getDefault())
                                .format(new Date());
                        
                        for (int i = 0; i < array.length(); i++) {
                            JSONObject item = array.getJSONObject(i);
                            String isoDate = item.optString("scheduledDateTime");
                            if (isoDate.length() >= 10) {
                                String dateKey = isoDate.substring(0, 10);
                                float energy = (float) item.optDouble("energyAmountKWh", 0);
                                dailyEnergy.put(dateKey, dailyEnergy.getOrDefault(dateKey, 0f) + energy);
                                if (dateKey.startsWith(thisMonth)) {
                                    monthKwh += energy;
                                    monthCount++;
                                }
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
                        final float finalMonthKwh = monthKwh;
                        final int finalMonthCount = monthCount;
                        runOnUiThread(() -> {
                            setupLineChart(entries, dates);
                            renderEarnings(finalMonthKwh, finalMonthCount);
                        });
                    }
                }
            } catch (Exception ignored) {}
        }).start();
    }

    // ── Earnings summary: this month kWh -> Rs. at Rs. 45/kWh ────────────────
    private void renderEarnings(float monthKwh, int monthCount) {
        // Estimate earnings from completed transfers at the regulated feed-in tariff
        if (tvEarningsValue == null) return;
        long earnings = Math.round(monthKwh * 45.0);
        tvEarningsValue.setText(String.format(Locale.getDefault(),
                "%.1f kWh → Rs. %,d", monthKwh, earnings));
        if (tvEarningsDetail != null) {
            String monthName = new SimpleDateFormat("MMMM", Locale.getDefault()).format(new Date());
            tvEarningsDetail.setText(monthName + " · " + monthCount
                    + (monthCount == 1 ? " transfer" : " transfers"));
        }
    }

    private void setupLineChart(List<Entry> entries, List<String> dates) {
        // Professional teal line with soft fill + eased animation
        if (entries.isEmpty()) {
            lineChart.setNoDataText("No transfer history available yet.");
            lineChart.setNoDataTextColor(ContextCompat.getColor(this, R.color.chart_teal_200));
            lineChart.invalidate();
            return;
        }

        LineDataSet dataSet = new LineDataSet(entries, "Energy (kWh)");
        dataSet.setColor(ContextCompat.getColor(this, R.color.chart_teal_500));
        dataSet.setValueTextColor(ContextCompat.getColor(this, R.color.text_brand));
        dataSet.setValueTextSize(10f);
        dataSet.setLineWidth(3f);
        dataSet.setCircleRadius(4f);
        dataSet.setCircleColor(ContextCompat.getColor(this, R.color.chart_teal_400));
        dataSet.setCircleHoleColor(Color.parseColor("#BFD5D0"));
        dataSet.setDrawCircleHole(true);
        dataSet.setDrawFilled(true);
        dataSet.setFillColor(ContextCompat.getColor(this, R.color.chart_teal_400));
        dataSet.setFillAlpha(55);
        dataSet.setMode(LineDataSet.Mode.CUBIC_BEZIER);
        dataSet.setCubicIntensity(0.18f);
        dataSet.setDrawValues(false);

        LineData lineData = new LineData(dataSet);
        lineChart.setData(lineData);

        lineChart.getDescription().setEnabled(false);
        lineChart.getLegend().setEnabled(false);
        lineChart.setPinchZoom(false);
        lineChart.setDoubleTapToZoomEnabled(false);

        XAxis xAxis = lineChart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setDrawAxisLine(false);
        xAxis.setGranularity(1f);
        xAxis.setValueFormatter(new IndexAxisValueFormatter(dates));
        xAxis.setTextColor(ContextCompat.getColor(this, R.color.chart_teal_300));
        xAxis.setTextSize(10f);

        lineChart.getAxisLeft().setTextColor(ContextCompat.getColor(this, R.color.chart_teal_200));
        lineChart.getAxisLeft().setDrawAxisLine(false);
        lineChart.getAxisLeft().setGridColor(ContextCompat.getColor(this, R.color.chart_teal_100));
        lineChart.getAxisLeft().enableGridDashedLine(8f, 6f, 0f);
        lineChart.getAxisLeft().setAxisMinimum(0f);
        lineChart.getAxisRight().setEnabled(false);

        try {
            lineChart.animateX(1200, com.github.mikephil.charting.animation.Easing.EaseOutQuart);
        } catch (Exception ignored) { lineChart.animateX(800); }
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
                    });
                }
            } catch (Exception e) {
                hideNearbyProgress();
            }
        }).start();
    }

    // ── Render a single nearby hub as compact horizontal card ───
    private void renderNearbyHubCard(JSONObject st, int rank) {
        // Compact 150dp hub card for horizontal scroll: house photo + name + slots
        if (layoutNearbyNodes == null) return;

        String name     = st.optString("name", "Microgrid Hub");
        String status   = st.optString("status", "Active");
        int    avSlots  = st.optInt("availableBatterySlots", 0);
        int    totSlots = st.optInt("totalBatterySlots", 0);
        boolean isActive = "Active".equalsIgnoreCase(status);

        int inkPrimary, inkSecondary;
        int dotColor;
        try {
            inkPrimary = getResources().getColor(R.color.text_brand);
            inkSecondary = getResources().getColor(R.color.text_brand);
            dotColor = getResources().getColor(isActive ? R.color.login_deep : R.color.chart_teal_200);
        } catch (Exception e) {
            inkPrimary = Color.parseColor("#063127");
            inkSecondary = Color.parseColor("#063127");
            dotColor = Color.parseColor(isActive ? "#063127" : "#8FB3A9");
        }

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(dpToPx(150), LinearLayout.LayoutParams.WRAP_CONTENT);
        cardParams.setMargins(0, 0, dpToPx(12), 0);
        card.setLayoutParams(cardParams);
        card.setClickable(true);
        card.setFocusable(true);
        try { card.setBackgroundResource(R.drawable.bg_hub_card); }
        catch (Exception ignored) {}

        ImageView thumb = new ImageView(this);
        LinearLayout.LayoutParams thumbParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(96));
        thumb.setLayoutParams(thumbParams);
        thumb.setScaleType(ImageView.ScaleType.CENTER_CROP);
        thumb.setClipToOutline(true);
        int[] houseArt = {
                R.drawable.house_solar_1, R.drawable.house_solar_2,
                R.drawable.house_solar_3, R.drawable.house_solar_4,
                R.drawable.house_solar_5 };
        try { thumb.setImageResource(houseArt[(rank - 1) % houseArt.length]); }
        catch (Exception ignored) {}
        card.addView(thumb);

        LinearLayout body = new LinearLayout(this);
        body.setOrientation(LinearLayout.VERTICAL);
        body.setPadding(dpToPx(10), dpToPx(8), dpToPx(10), dpToPx(10));
        body.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        card.addView(body);

        TextView tvName = new TextView(this);
        tvName.setText(name);
        tvName.setTextSize(13f);
        tvName.setTypeface(null, Typeface.BOLD);
        tvName.setTextColor(inkPrimary);
        tvName.setMaxLines(1);
        tvName.setEllipsize(android.text.TextUtils.TruncateAt.END);
        body.addView(tvName);

        LinearLayout slotRow = new LinearLayout(this);
        slotRow.setOrientation(LinearLayout.HORIZONTAL);
        slotRow.setGravity(Gravity.CENTER_VERTICAL);
        slotRow.setPadding(0, dpToPx(4), 0, 0);
        View dot = new View(this);
        LinearLayout.LayoutParams dotParams = new LinearLayout.LayoutParams(dpToPx(8), dpToPx(8));
        dotParams.setMargins(0, 0, dpToPx(6), 0);
        dot.setLayoutParams(dotParams);
        dot.setBackgroundResource(R.drawable.bg_loading_dot);
        try { dot.getBackground().setTint(dotColor); } catch (Exception ignored) {}
        slotRow.addView(dot);

        TextView tvSlots = new TextView(this);
        tvSlots.setText(avSlots + "/" + totSlots + " slots");
        tvSlots.setTextSize(11f);
        tvSlots.setTextColor(inkSecondary);
        slotRow.addView(tvSlots);
        body.addView(slotRow);

        card.setOnTouchListener((v, event) -> {
            if (event.getAction() == android.view.MotionEvent.ACTION_DOWN) {
                v.animate().scaleX(0.96f).scaleY(0.96f).setDuration(90).start();
            } else if (event.getAction() == android.view.MotionEvent.ACTION_UP
                    || event.getAction() == android.view.MotionEvent.ACTION_CANCEL) {
                v.animate().scaleX(1f).scaleY(1f).setDuration(160).start();
            }
            return false;
        });

        String stationId = st.optString("id");
        card.setOnClickListener(v -> {
            Intent intent = new Intent(this, StationMapActivity.class);
            intent.putExtra("target_station_id", stationId);
            startActivity(intent);
        });

        card.setAlpha(0f);
        card.setTranslationX(dpToPx(24));
        card.animate().alpha(1f).translationX(0f)
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
        try { tvTitle.setTextColor(getResources().getColor(R.color.text_brand)); }
        catch (Exception ignored) {}
        box.addView(tvTitle);

        TextView tv = new TextView(this);
        tv.setText(msg);
        tv.setTextSize(12f);
        tv.setGravity(Gravity.CENTER);
        try { tv.setTextColor(getResources().getColor(R.color.chart_teal_300)); }
        catch (Exception ignored) {}
        box.addView(tv);

        box.setAlpha(0f);
        box.animate().alpha(1f).setDuration(300).start();
        layoutNearbyNodes.addView(box);
    }

    // ── Upcoming approved booking + week strip ───────────────────────────────
    private void loadUpcomingBooking() {
        String nic = sessionManager.getNic();
        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this,
                        "reservations?prosumerNic=" + nic).get().build();
                try (Response response = ApiClient.getClient().newCall(request).execute()) {
                    if (response.body() == null) return;
                    JSONArray array = new JSONArray(response.body().string());
                    java.text.SimpleDateFormat parser =
                            new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
                    java.text.SimpleDateFormat dayKey =
                            new java.text.SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
                    Date now = new Date();
                    JSONObject best = null;
                    Date bestDate = null;
                    approvedDateKeys.clear();
                    for (int i = 0; i < array.length(); i++) {
                        JSONObject item = array.getJSONObject(i);
                        if (!"Approved".equalsIgnoreCase(item.optString("status"))) continue;
                        String iso = item.optString("scheduledDateTime");
                        if (iso.length() < 10) continue;
                        try {
                            Date d = parser.parse(iso.length() > 19 ? iso.substring(0, 19) : iso);
                            approvedDateKeys.add(dayKey.format(d));
                            if (!d.before(now) && (bestDate == null || d.before(bestDate))) {
                                bestDate = d;
                                best = item;
                            }
                        } catch (Exception ignored) {}
                    }
                    JSONObject finalBest = best;
                    Date finalBestDate = bestDate;
                    runOnUiThread(() -> {
                        renderUpcoming(finalBest, finalBestDate);
                        renderWeekStrip();
                    });
                }
            } catch (Exception ignored) {
                runOnUiThread(this::renderWeekStrip);
            }
        }).start();
    }

    private void renderUpcoming(JSONObject booking, Date date) {
        if (tvUpcomingHub == null) return;
        if (booking == null || date == null) {
            tvUpcomingHub.setText("No approved bookings");
            if (tvUpcomingDate != null) tvUpcomingDate.setText("Book a solar slot to get started");
            if (tvUpcomingTime != null) tvUpcomingTime.setText("");
            upcomingReservationId = null;
            return;
        }
        upcomingReservationId = booking.optString("id");
        tvUpcomingHub.setText(booking.optString("stationName", "Solar Hub"));
        try {
            String dateStr = new SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(date);
            String timeStr = new SimpleDateFormat("hh:mm a", Locale.getDefault()).format(date);
            if (tvUpcomingDate != null) tvUpcomingDate.setText(dateStr);
            if (tvUpcomingTime != null) tvUpcomingTime.setText(timeStr + " • " + booking.optDouble("energyAmountKWh", 0) + " kWh");
        } catch (Exception ignored) {}
    }

    private void renderWeekStrip() {
        if (layoutWeekStrip == null) return;
        layoutWeekStrip.removeAllViews();
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.DAY_OF_WEEK, cal.getFirstDayOfWeek());
        // Force Monday start like reference
        cal.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);
        java.text.SimpleDateFormat dayName = new java.text.SimpleDateFormat("EEE", Locale.getDefault());
        java.text.SimpleDateFormat dayNum = new java.text.SimpleDateFormat("d", Locale.getDefault());
        java.text.SimpleDateFormat dayKey = new java.text.SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        int todayNum = Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
        for (int i = 0; i < 7; i++) {
            Date d = cal.getTime();
            boolean isApproved = approvedDateKeys.contains(dayKey.format(d));
            boolean isToday = cal.get(Calendar.DAY_OF_YEAR) == todayNum;
            layoutWeekStrip.addView(buildDayCell(
                    dayName.format(d), dayNum.format(d), isApproved, isToday));
            cal.add(Calendar.DAY_OF_MONTH, 1);
        }
    }

    private View buildDayCell(String day, String num, boolean highlighted, boolean isToday) {
        LinearLayout cell = new LinearLayout(this);
        cell.setOrientation(LinearLayout.VERTICAL);
        cell.setGravity(Gravity.CENTER_HORIZONTAL);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        cell.setLayoutParams(params);

        TextView tvDay = new TextView(this);
        tvDay.setText(day);
        tvDay.setTextSize(11f);
        tvDay.setGravity(Gravity.CENTER);
        try {
            tvDay.setTextColor(getResources().getColor(highlighted
                    ? R.color.text_brand : R.color.chart_teal_200));
        } catch (Exception ignored) {}
        cell.addView(tvDay);

        FrameLayout circle = new FrameLayout(this);
        LinearLayout.LayoutParams circleParams = new LinearLayout.LayoutParams(dpToPx(36), dpToPx(36));
        circleParams.setMargins(0, dpToPx(6), 0, 0);
        circle.setLayoutParams(circleParams);
        if (highlighted) {
            try { circle.setBackgroundResource(R.drawable.bg_week_selected); }
            catch (Exception ignored) {}
        } else if (isToday) {
            try { circle.setBackgroundResource(R.drawable.bg_neuro_icon_circle); }
            catch (Exception ignored) {}
        }

        TextView tvNum = new TextView(this);
        tvNum.setText(num);
        tvNum.setTextSize(14f);
        tvNum.setTypeface(null, Typeface.BOLD);
        tvNum.setGravity(Gravity.CENTER);
        FrameLayout.LayoutParams numParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
        tvNum.setLayoutParams(numParams);
        tvNum.setGravity(Gravity.CENTER);
        try {
            tvNum.setTextColor(getResources().getColor(highlighted
                    ? R.color.chart_teal_100 : R.color.text_brand));
        } catch (Exception ignored) {}
        circle.addView(tvNum);
        cell.addView(circle);

        cell.setAlpha(0f);
        cell.setTranslationY(dpToPx(8));
        cell.animate().alpha(1f).translationY(0f).setDuration(280).start();
        return cell;
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
            int[] fadeViews = { R.id.dashboard_banner, R.id.energy_card, R.id.earnings_card, R.id.slots_card };
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

    // ── Booking notifications (completed + operator-cancelled) ─────────────
    private void wireNotifications() {
        // Bell toggles the dropdown card under the top bar
        if (btnNotifications != null && layoutNotifDropdown != null) {
            btnNotifications.setOnClickListener(v ->
                    layoutNotifDropdown.setVisibility(
                            layoutNotifDropdown.getVisibility() == View.VISIBLE ? View.GONE : View.VISIBLE));
        }
    }

    private java.util.Set<String> getReadNotifIds() {
        // Per-prosumer read set: only a tap marks a notification read, never auto-clear
        String key = "read_" + sessionManager.getNic();
        return new java.util.HashSet<>(getSharedPreferences("prosumer_notif_read", MODE_PRIVATE)
                .getStringSet(key, new java.util.HashSet<>()));
    }

    private void markNotifRead(String reservationId) {
        String key = "read_" + sessionManager.getNic();
        java.util.Set<String> read = getReadNotifIds();
        if (read.add(reservationId)) {
            getSharedPreferences("prosumer_notif_read", MODE_PRIVATE)
                    .edit().putStringSet(key, read).apply();
        }
    }

    private void loadNotifications() {
        // Completed bookings + bookings cancelled by the operator stay listed until tapped
        String nic = sessionManager.getNic();
        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this,
                        "reservations?prosumerNic=" + nic).get().build();
                try (Response response = ApiClient.getClient().newCall(request).execute()) {
                    if (response.body() == null) return;
                    JSONArray array = new JSONArray(response.body().string());
                    java.util.Set<String> read = getReadNotifIds();
                    List<JSONObject> unread = new ArrayList<>();
                    for (int i = 0; i < array.length(); i++) {
                        JSONObject b = array.getJSONObject(i);
                        String id = b.optString("id", "");
                        if (id.isEmpty() || read.contains(id)) continue;
                        String status = b.optString("status", "");
                        boolean completed = "Completed".equalsIgnoreCase(status);
                        boolean missed = "Missed".equalsIgnoreCase(status);
                        boolean opCancelled = ("Cancelled".equalsIgnoreCase(status)
                                || "Canceled".equalsIgnoreCase(status))
                                && b.optString("operatorNotes", "")
                                        .startsWith("Cancelled by Grid Operator");
                        if (completed || missed || opCancelled) unread.add(b);
                    }
                    runOnUiThread(() -> renderNotifications(unread));
                }
            } catch (Exception ignored) {}
        }).start();
    }

    private void renderNotifications(List<JSONObject> unread) {
        if (tvNotifBadge != null) {
            tvNotifBadge.setVisibility(unread.isEmpty() ? View.GONE : View.VISIBLE);
            tvNotifBadge.setText(String.valueOf(Math.min(unread.size(), 99)));
        }
        if (layoutNotifList == null) return;
        layoutNotifList.removeAllViews();
        if (tvNotifEmpty != null) {
            tvNotifEmpty.setVisibility(unread.isEmpty() ? View.VISIBLE : View.GONE);
        }
        LayoutInflater inflater = LayoutInflater.from(this);
        for (int i = unread.size() - 1; i >= 0; i--) {
            JSONObject b = unread.get(i);
            String status = b.optString("status", "");
            boolean completed = "Completed".equalsIgnoreCase(status);
            boolean missed = "Missed".equalsIgnoreCase(status);
            View row = inflater.inflate(R.layout.item_notif, layoutNotifList, false);
            TextView tvTitle = row.findViewById(R.id.tv_notif_title);
            TextView tvSub = row.findViewById(R.id.tv_notif_sub);
            View dot = row.findViewById(R.id.view_notif_dot);
            tvTitle.setText(completed ? "Booking completed"
                    : missed ? "Missed booking" : "Cancelled by operator");
            tvSub.setText(b.optString("reservationCode", "RES-?")
                    + " · " + b.optString("stationName", "Solar Hub")
                    + " · " + b.optDouble("energyAmountKWh", 0) + " kWh");
            if (dot != null) {
                dot.setBackgroundResource(completed
                        ? R.drawable.bg_track_dot_done
                        : missed ? R.drawable.bg_track_dot_todo
                        : R.drawable.bg_track_dot_current);
            }
            final String bookingId = b.optString("id", "");
            row.setClickable(true);
            row.setFocusable(true);
            row.setOnClickListener(v -> {
                // Mark read only on tap, then open that booking pass
                markNotifRead(bookingId);
                loadNotifications();
                Intent intent = new Intent(this, BookingDetailActivity.class);
                intent.putExtra("reservation_id", bookingId);
                startActivity(intent);
            });
            layoutNotifList.addView(row);
        }
    }

    @Override
    protected void onResume() {
        // Refresh dashboard statistics, energy history graph, and nearby nodes on screen resume
        super.onResume();
        // Back from a sub-page (back button) lands here: snap navbar back to home
        navSelected = 0;
        navLeaving = false;
        paintNavIcons(navIconIds, 0);
        loadDashboardStats();
        loadEnergyTransferHistory();
        loadNearbyNodes();
        loadUpcomingBooking();
        loadNotifications();
    }
}
