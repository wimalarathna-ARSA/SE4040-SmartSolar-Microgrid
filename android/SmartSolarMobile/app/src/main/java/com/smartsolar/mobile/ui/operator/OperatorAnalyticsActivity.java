// ============================================================================
// File: OperatorAnalyticsActivity.java
// Description: Grid Operator fleet analytics dashboard with 5 operational
//              charts reusing the prosumer analytics chart styles:
//              segmented bars, teal donut, fan gauge and weekday heatmap.
// Architecture: FAT Service Pattern - All data from central C# Web API
// ============================================================================
package com.smartsolar.mobile.ui.operator;

import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.SessionManager;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.*;

public class OperatorAnalyticsActivity extends AppCompatActivity {

    private com.smartsolar.mobile.ui.common.FanGaugeView gaugeFulfillment;
    private com.smartsolar.mobile.ui.common.RingChartView ringNoshow;
    private LinearLayout layoutNoshowLegend;
    private TextView tvFulfillPct, tvFulfillSub, tvCapacitySub, tvRevenueSub;
    private TextView tvNoshowPct, tvNoshowSub;
    private LinearLayout layoutCapacitySegments;
    private LinearLayout layoutRevenueSegments;
    private LinearLayout layoutActivityBars;
    private View progressBar;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Initialise session, bind chart views and progress bar, wire back button, and trigger analytics load
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_operator_analytics);

        sessionManager = new SessionManager(this);
        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());

        ringNoshow = findViewById(R.id.ring_noshow);
        layoutNoshowLegend = findViewById(R.id.layout_noshow_legend);
        tvNoshowPct = findViewById(R.id.tv_noshow_pct);
        tvNoshowSub = findViewById(R.id.tv_noshow_sub);
        gaugeFulfillment = findViewById(R.id.gauge_fulfillment);
        tvFulfillPct = findViewById(R.id.tv_fulfill_pct);
        tvFulfillSub = findViewById(R.id.tv_fulfill_sub);
        tvCapacitySub = findViewById(R.id.tv_capacity_sub);
        tvRevenueSub = findViewById(R.id.tv_revenue_sub);
        layoutCapacitySegments = findViewById(R.id.layout_capacity_segments);
        layoutRevenueSegments = findViewById(R.id.layout_revenue_segments);
        layoutActivityBars = findViewById(R.id.layout_activity_bars);
        progressBar        = findViewById(R.id.progress_bar);

        applyEntranceMotion();
        loadAnalyticsData();
    }

    /** Staggered card entrance: header fades, cards rise one after another. */
    private void applyEntranceMotion() {
        try {
            int[] cardIds = { R.id.card_capacity, R.id.card_noshow, R.id.card_fulfillment,
                    R.id.card_activity, R.id.card_revenue };
            for (int i = 0; i < cardIds.length; i++) {
                View v = findViewById(cardIds[i]);
                if (v != null) {
                    android.view.animation.Animation rise =
                            android.view.animation.AnimationUtils.loadAnimation(this, R.anim.slide_up);
                    rise.setStartOffset(120L * i);
                    rise.setDuration(400);
                    v.startAnimation(rise);
                }
            }
            View header = findViewById(R.id.analytics_header);
            if (header != null) {
                header.startAnimation(
                        android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in));
            }
        } catch (Exception ignored) {}
    }

    private void loadAnalyticsData() {
        // GET stations + reservations (fleet-wide) to feed all five charts
        progressBar.setVisibility(View.VISIBLE);

        new Thread(() -> {
            try {
                Request stationsReq = ApiClient.buildAuthRequest(this, "stations").get().build();
                JSONArray stations;
                try (Response res = ApiClient.getClient().newCall(stationsReq).execute()) {
                    stations = new JSONArray(res.body() != null ? res.body().string() : "[]");
                }
                Request reservationsReq = ApiClient.buildAuthRequest(this, "reservations").get().build();
                JSONArray reservations;
                try (Response res = ApiClient.getClient().newCall(reservationsReq).execute()) {
                    reservations = new JSONArray(res.body() != null ? res.body().string() : "[]");
                }
                final JSONArray fStations = stations;
                final JSONArray fReservations = reservations;
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    try {
                        renderCapacity(fStations);
                        processReservations(fReservations);
                    } catch (Exception ignored) {}
                });
            } catch (Exception e) {
                runOnUiThread(() -> progressBar.setVisibility(View.GONE));
            }
        }).start();
    }

    // ── 1. Battery Slots & Station Capacity (segmented bars per station) ──
    private void renderCapacity(JSONArray stations) throws Exception {
        if (layoutCapacitySegments == null) return;
        layoutCapacitySegments.removeAllViews();

        List<JSONObject> list = new ArrayList<>();
        int totalFree = 0, totalSlots = 0;
        for (int i = 0; i < stations.length(); i++) {
            JSONObject s = stations.getJSONObject(i);
            list.add(s);
            totalFree += s.optInt("availableBatterySlots", 0);
            totalSlots += s.optInt("totalBatterySlots", 0);
        }
        // Biggest hubs first, top 8
        list.sort((a, b) -> Integer.compare(
                b.optInt("totalBatterySlots", 0), a.optInt("totalBatterySlots", 0)));
        if (list.size() > 8) list = list.subList(0, 8);

        if (tvCapacitySub != null) {
            tvCapacitySub.setText(totalFree + " of " + totalSlots + " slots free fleet-wide");
        }
        if (list.isEmpty()) {
            layoutCapacitySegments.addView(emptyText("No stations reporting."));
            return;
        }

        int row = 0;
        for (JSONObject s : list) {
            int free = s.optInt("availableBatterySlots", 0);
            int total = s.optInt("totalBatterySlots", 0);
            int pct = total > 0 ? Math.round((free * 100f) / total) : 0;
            String label = s.optString("name", "Hub")
                    + " [" + s.optString("stationCode", "—") + "]";
            layoutCapacitySegments.addView(buildSegmentRow(
                    label, free + " / " + total + " free", pct,
                    segmentColor(row), row));
            row++;
        }
    }

    // ── 2-5. Reservation aggregates ───────────────────────────────────────
    private void processReservations(JSONArray array) throws Exception {
        int missed = 0, total = 0;
        int completed = 0, cancelled = 0;
        Map<String, Integer> statusCounts = new HashMap<>();
        Map<String, Float> monthlyRevenue = new TreeMap<>(); // yyyy-MM
        Map<String, float[]> stationWeekCounts = new HashMap<>(); // station -> Sun..Sat counts

        Calendar cal = Calendar.getInstance();
        int currentWeek = cal.get(Calendar.WEEK_OF_YEAR);
        int currentYear = cal.get(Calendar.YEAR);
        SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());

        for (int i = 0; i < array.length(); i++) {
            JSONObject item = array.getJSONObject(i);
            String status = item.optString("status", "");
            String station = item.optString("stationName", "Hub");
            String isoDate = item.optString("scheduledDateTime", "");
            total++;
            String normStatus = normalizeStatus(status);
            statusCounts.put(normStatus, statusCounts.getOrDefault(normStatus, 0) + 1);

            if ("Missed".equalsIgnoreCase(status)) {
                missed++;
            }
            if ("Completed".equalsIgnoreCase(status)) {
                completed++;
                if (isoDate.length() >= 10) {
                    Date date = parser.parse(isoDate);
                    String monthKey = new SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(date);
                    monthlyRevenue.put(monthKey,
                            monthlyRevenue.getOrDefault(monthKey, 0f)
                                    + (float) item.optDouble("totalCost", 0));
                }
            } else if ("Cancelled".equalsIgnoreCase(status) || "Canceled".equalsIgnoreCase(status)) {
                cancelled++;
            }

            // Station activity: every booking this week counts
            if (isoDate.length() >= 10) {
                try {
                    Date date = parser.parse(isoDate);
                    cal.setTime(date);
                    if (cal.get(Calendar.WEEK_OF_YEAR) == currentWeek
                            && cal.get(Calendar.YEAR) == currentYear) {
                        int sunIndex = cal.get(Calendar.DAY_OF_WEEK) - Calendar.SUNDAY;
                        float[] cells = stationWeekCounts.get(station);
                        if (cells == null) {
                            cells = new float[7];
                            stationWeekCounts.put(station, cells);
                        }
                        if (sunIndex >= 0 && sunIndex < 7) cells[sunIndex] += 1f;
                    }
                } catch (Exception ignored) {}
            }
        }

        setupNoshow(missed, total, statusCounts);
        setupFulfillment(completed, cancelled);
        setupRevenue(monthlyRevenue);
        Map<String, Integer> hubWeekTotals = new HashMap<>();
        for (Map.Entry<String, float[]> e : stationWeekCounts.entrySet()) {
            hubWeekTotals.put(e.getKey(), Math.round(weekTotal(e.getValue())));
        }
        setupActivityBars(hubWeekTotals);
    }

    private static String normalizeStatus(String status) {
        if ("Canceled".equalsIgnoreCase(status)) return "Cancelled";
        if (status == null || status.isEmpty()) return "Pending";
        return status.substring(0, 1).toUpperCase(Locale.getDefault())
                + status.substring(1).toLowerCase(Locale.getDefault());
    }

    // ── 2. No-Show & Missed Booking Rate ring chart (status-share rings) ──
    private static final int[] RING_COLORS = {
            0xFF063127, 0xFF3B796A, 0xFF65998B, 0xFF8FB3A9, 0xFFBFD5D0 };

    private void setupNoshow(int missed, int total, Map<String, Integer> statusCounts) {
        float missFraction = total > 0 ? (missed * 1f) / total : 0f;
        int pct = Math.round(missFraction * 100f);
        if (tvNoshowPct != null) tvNoshowPct.setText(pct + "%");
        if (tvNoshowSub != null) {
            tvNoshowSub.setText(missed + " of " + total + " scheduled missed");
        }

        // Rings: biggest status shares outermost, darkest greens first
        List<Map.Entry<String, Integer>> entries = new ArrayList<>(statusCounts.entrySet());
        entries.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        if (entries.size() > RING_COLORS.length) entries = entries.subList(0, RING_COLORS.length);

        List<com.smartsolar.mobile.ui.common.RingChartView.Ring> rings = new ArrayList<>();
        for (int i = 0; i < entries.size(); i++) {
            float fraction = total > 0 ? (entries.get(i).getValue() * 1f) / total : 0f;
            rings.add(new com.smartsolar.mobile.ui.common.RingChartView.Ring(
                    fraction, RING_COLORS[i % RING_COLORS.length]));
        }
        if (ringNoshow != null) ringNoshow.setRings(rings);

        // Legend rows: dot + status + share %
        if (layoutNoshowLegend != null) {
            layoutNoshowLegend.removeAllViews();
            for (int i = 0; i < entries.size(); i++) {
                Map.Entry<String, Integer> e = entries.get(i);
                int share = total > 0 ? Math.round((e.getValue() * 100f) / total) : 0;
                layoutNoshowLegend.addView(
                        buildLegendRow(e.getKey(), share, RING_COLORS[i % RING_COLORS.length],
                                i < entries.size() - 1));
            }
        }
    }

    /** One legend row: color dot + status label + share %. */
    private View buildLegendRow(String label, int pct, int color, boolean divider) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(0, dpToPx(8), 0, dpToPx(8));

        View dot = new View(this);
        LinearLayout.LayoutParams dotParams = new LinearLayout.LayoutParams(dpToPx(12), dpToPx(12));
        dot.setLayoutParams(dotParams);
        try {
            android.graphics.drawable.GradientDrawable bg = new android.graphics.drawable.GradientDrawable();
            bg.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
            bg.setCornerRadius(dpToPx(6));
            bg.setColor(color);
            dot.setBackground(bg);
        } catch (Exception ignored) {
            dot.setBackgroundColor(color);
        }
        row.addView(dot);

        TextView tvLabel = new TextView(this);
        tvLabel.setText(label);
        tvLabel.setTextSize(13f);
        tvLabel.setTextColor(color == 0xFFBFD5D0 ? 0xFF3B796A : 0xFF063127);
        LinearLayout.LayoutParams labelParams = new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        labelParams.leftMargin = dpToPx(10);
        tvLabel.setLayoutParams(labelParams);
        row.addView(tvLabel);

        TextView tvPct = new TextView(this);
        tvPct.setText(pct + "%");
        tvPct.setTextSize(13f);
        tvPct.setTypeface(null, Typeface.BOLD);
        tvPct.setTextColor(0xFF063127);
        row.addView(tvPct);

        LinearLayout wrap = new LinearLayout(this);
        wrap.setOrientation(LinearLayout.VERTICAL);
        wrap.addView(row);
        if (divider) {
            View line = new View(this);
            line.setLayoutParams(new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(1)));
            line.setBackgroundColor(0xFFBFD5D0);
            wrap.addView(line);
        }
        return wrap;
    }

    // ── 3. Fulfillment fan gauge (completed share of settled jobs) ────────
    private void setupFulfillment(int completed, int cancelled) {
        int settled = completed + cancelled;
        float fraction = settled > 0 ? (completed * 1f) / settled : 0f;
        int pct = Math.round(fraction * 100f);
        if (gaugeFulfillment != null) gaugeFulfillment.setFraction(fraction);
        if (tvFulfillPct != null) tvFulfillPct.setText(pct + "%");
        if (tvFulfillSub != null) {
            tvFulfillSub.setText(completed + " of " + settled + " jobs fulfilled");
        }
    }

    // ── 5. Revenue & Settlement (segmented monthly revenue bars) ─────────
    private void setupRevenue(Map<String, Float> dataMap) {
        if (layoutRevenueSegments == null) return;
        layoutRevenueSegments.removeAllViews();

        List<Map.Entry<String, Float>> entries = new ArrayList<>(dataMap.entrySet());
        if (entries.size() > 6) entries = entries.subList(entries.size() - 6, entries.size());

        float total = 0f;
        for (Map.Entry<String, Float> e : entries) total += e.getValue();

        if (tvRevenueSub != null) {
            tvRevenueSub.setText(entries.isEmpty() ? "Settled value per month"
                    : String.format(Locale.getDefault(), "Rs. %.2f settled in range", total));
        }
        if (entries.isEmpty() || total <= 0f) {
            layoutRevenueSegments.addView(emptyText("No settlements recorded yet."));
            return;
        }

        SimpleDateFormat inFmt = new SimpleDateFormat("yyyy-MM", Locale.getDefault());
        SimpleDateFormat outFmt = new SimpleDateFormat("MMM yyyy", Locale.getDefault());
        int row = 0;
        for (Map.Entry<String, Float> e : entries) {
            String monthLabel = e.getKey();
            try {
                Date d = inFmt.parse(e.getKey());
                if (d != null) monthLabel = outFmt.format(d);
            } catch (Exception ignored) {}
            int pct = Math.round((e.getValue() / total) * 100f);
            layoutRevenueSegments.addView(buildSegmentRow(
                    monthLabel,
                    String.format(Locale.getDefault(), "Rs. %.2f", e.getValue()),
                    pct, segmentColor(row), row));
            row++;
        }
    }

    // ── 4. Station Activity bars (weekly booking counts per hub, rounded bars) ──
    private void setupActivityBars(Map<String, Integer> hubTotals) {
        if (layoutActivityBars == null) return;
        layoutActivityBars.removeAllViews();

        List<Map.Entry<String, Integer>> hubs = new ArrayList<>(hubTotals.entrySet());
        hubs.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        if (hubs.size() > 7) hubs = hubs.subList(0, 7);

        int max = 0;
        for (Map.Entry<String, Integer> h : hubs) max = Math.max(max, h.getValue());

        if (hubs.isEmpty() || max <= 0) {
            TextView tv = emptyText("No bookings this week yet.");
            tv.setGravity(Gravity.CENTER);
            layoutActivityBars.setGravity(Gravity.CENTER);
            layoutActivityBars.addView(tv);
            return;
        }
        layoutActivityBars.setGravity(Gravity.BOTTOM | Gravity.START);

        int index = 0;
        for (Map.Entry<String, Integer> h : hubs) {
            layoutActivityBars.addView(buildActivityBar(h.getKey(), h.getValue(), max, index));
            index++;
        }
    }

    /** One rounded bar column: count on top, green bar, hub name below. */
    private View buildActivityBar(String station, int count, int max, int index) {
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setGravity(Gravity.CENTER_HORIZONTAL);
        LinearLayout.LayoutParams colParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.MATCH_PARENT);
        colParams.leftMargin = dpToPx(10);
        colParams.rightMargin = dpToPx(10);
        col.setLayoutParams(colParams);

        int color = heatColor(heatBucket(count, max));

        TextView tvCount = new TextView(this);
        tvCount.setText(String.valueOf(count));
        tvCount.setTextSize(13f);
        tvCount.setTypeface(null, Typeface.BOLD);
        tvCount.setTextColor(color);
        tvCount.setGravity(Gravity.CENTER);
        tvCount.setPadding(0, 0, 0, dpToPx(6));
        col.addView(tvCount);

        int barHeight = dpToPx(10) + Math.round(dpToPx(150) * (count * 1f) / max);
        View bar = new View(this);
        LinearLayout.LayoutParams barParams = new LinearLayout.LayoutParams(dpToPx(38), barHeight);
        bar.setLayoutParams(barParams);
        try {
            android.graphics.drawable.GradientDrawable bg = new android.graphics.drawable.GradientDrawable();
            bg.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
            bg.setCornerRadius(dpToPx(19));
            bg.setColor(color);
            bar.setBackground(bg);
        } catch (Exception ignored) {
            bar.setBackgroundColor(color);
        }
        col.addView(bar);

        TextView tvName = new TextView(this);
        String shortName = station == null ? "Hub" : station;
        if (shortName.length() > 10) shortName = shortName.substring(0, 9) + "…";
        tvName.setText(shortName);
        tvName.setTextSize(11f);
        tvName.setMaxLines(1);
        tvName.setEllipsize(android.text.TextUtils.TruncateAt.END);
        tvName.setGravity(Gravity.CENTER);
        tvName.setMaxWidth(dpToPx(76));
        try { tvName.setTextColor(getResources().getColor(R.color.neuro_text_secondary)); }
        catch (Exception ignored) {}
        tvName.setPadding(0, dpToPx(8), 0, 0);
        col.addView(tvName);

        // Grow animation from the baseline
        bar.setPivotY(barHeight);
        bar.setScaleY(0f);
        bar.animate().scaleY(1f).setDuration(450)
                .setStartDelay(Math.min(index, 7) * 90L).start();
        return col;
    }

    // ── Shared builders (same styles as prosumer analytics) ───────────────
    private static final int SEGMENT_COUNT = 24;
    private static final String[] SEGMENT_COLORS = {
            "#BFD5D0", "#8FB3A9", "#65998B", "#3B796A", "#063127" };

    private static int segmentColor(int row) {
        try { return Color.parseColor(SEGMENT_COLORS[row % SEGMENT_COLORS.length]); }
        catch (Exception e) { return Color.parseColor("#3B796A"); }
    }

    private TextView emptyText(String msg) {
        TextView tv = new TextView(this);
        tv.setText(msg);
        tv.setTextSize(13f);
        try { tv.setTextColor(getResources().getColor(R.color.neuro_text_muted)); }
        catch (Exception ignored) {}
        return tv;
    }

    /** One segmented row: label + value on top, dashed bar below, share % on the right. */
    private View buildSegmentRow(String label, String valueText, int pct, int color, int rowIndex) {
        LinearLayout rowBox = new LinearLayout(this);
        rowBox.setOrientation(LinearLayout.HORIZONTAL);
        rowBox.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams boxParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        if (rowIndex > 0) boxParams.topMargin = dpToPx(14);
        rowBox.setLayoutParams(boxParams);

        LinearLayout left = new LinearLayout(this);
        left.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams leftParams = new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        left.setLayoutParams(leftParams);
        rowBox.addView(left);

        TextView tvLabel = new TextView(this);
        tvLabel.setText(label + "  ·  " + valueText);
        tvLabel.setTextSize(13f);
        tvLabel.setTypeface(null, Typeface.BOLD);
        try { tvLabel.setTextColor(getResources().getColor(R.color.neuro_text_primary)); }
        catch (Exception ignored) {}
        left.addView(tvLabel);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams barParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(18));
        barParams.topMargin = dpToPx(6);
        bar.setLayoutParams(barParams);
        left.addView(bar);

        int filled = Math.round((pct / 100f) * SEGMENT_COUNT);
        int faded = Color.argb(55, Color.red(color), Color.green(color), Color.blue(color));
        for (int i = 0; i < SEGMENT_COUNT; i++) {
            View dash = new View(this);
            LinearLayout.LayoutParams dashParams = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.MATCH_PARENT, 1f);
            if (i < SEGMENT_COUNT - 1) dashParams.rightMargin = dpToPx(3);
            dash.setLayoutParams(dashParams);
            try {
                android.graphics.drawable.GradientDrawable bg = new android.graphics.drawable.GradientDrawable();
                bg.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
                bg.setCornerRadius(dpToPx(2));
                bg.setColor(i < filled ? color : faded);
                dash.setBackground(bg);
            } catch (Exception ignored) {
                dash.setBackgroundColor(i < filled ? color : faded);
            }
            bar.addView(dash);
        }

        TextView tvPct = new TextView(this);
        tvPct.setText(pct + "%");
        tvPct.setTextSize(14f);
        tvPct.setTypeface(null, Typeface.BOLD);
        tvPct.setGravity(Gravity.END);
        tvPct.setTextColor(color);
        LinearLayout.LayoutParams pctParams = new LinearLayout.LayoutParams(
                dpToPx(52), LinearLayout.LayoutParams.WRAP_CONTENT);
        pctParams.leftMargin = dpToPx(10);
        tvPct.setLayoutParams(pctParams);
        rowBox.addView(tvPct);

        rowBox.setAlpha(0f);
        rowBox.setTranslationY(dpToPx(8));
        rowBox.animate().alpha(1f).translationY(0f)
                .setDuration(320)
                .setStartDelay(Math.min(rowIndex, 6) * 90L)
                .start();
        return rowBox;
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    private static float weekTotal(float[] cells) {
        float t = 0f;
        for (float v : cells) t += v;
        return t;
    }

    private static final String[] HEAT_COLORS = {
            "#BFD5D0", "#8FB3A9", "#65998B", "#3B796A", "#063127" };

    private static int heatBucket(float v, float max) {
        if (v <= 0f || max <= 0f) return 0;
        float f = v / max;
        if (f <= 0.25f) return 1;
        if (f <= 0.50f) return 2;
        if (f <= 0.75f) return 3;
        return 4;
    }

    private static int heatColor(int bucket) {
        try { return Color.parseColor(HEAT_COLORS[Math.min(bucket, HEAT_COLORS.length - 1)]); }
        catch (Exception e) { return Color.parseColor("#3B796A"); }
    }

    @Override
    protected void onDestroy() {
        // Release session manager resources on activity teardown
        super.onDestroy();
        if (sessionManager != null) sessionManager.close();
    }
}
