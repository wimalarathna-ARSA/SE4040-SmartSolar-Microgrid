// ============================================================================
// File: AnalyticsActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Prosumer energy trading and savings analytics visualization dashboard.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.github.mikephil.charting.animation.Easing;
import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.HorizontalBarChart;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.charts.PieChart;
import com.github.mikephil.charting.components.Legend;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.*;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;
import com.github.mikephil.charting.formatter.PercentFormatter;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.SessionManager;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.*;

public class AnalyticsActivity extends AppCompatActivity {

    private PieChart chartBookingStatus;
    private com.smartsolar.mobile.ui.common.FanGaugeView gaugeWeekly;
    private TextView tvGaugePct, tvWeeklySub;
    private LinearLayout layoutMonthlySegments;
    private LinearLayout layoutNodeHeatmap;
    private LinearLayout layoutNodeLegend;
    private View progressBar;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Initialise session, bind chart views and progress bar, wire back button, and trigger analytics load
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_analytics);

        sessionManager = new SessionManager(this);
        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());

        chartBookingStatus = findViewById(R.id.chart_booking_status);
        gaugeWeekly = findViewById(R.id.gauge_weekly);
        tvGaugePct = findViewById(R.id.tv_gauge_pct);
        tvWeeklySub = findViewById(R.id.tv_weekly_sub);
        layoutMonthlySegments = findViewById(R.id.layout_monthly_segments);
        layoutNodeHeatmap = findViewById(R.id.layout_node_heatmap);
        layoutNodeLegend = findViewById(R.id.layout_node_legend);
        progressBar        = findViewById(R.id.progress_bar);

        applyEntranceMotion();
        loadAnalyticsData();
    }

    /** Staggered card entrance: header fades, cards rise one after another. */
    private void applyEntranceMotion() {
        try {
            int[] cardIds = { R.id.card_booking, R.id.card_weekly, R.id.card_monthly, R.id.card_node };
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
        // GET /api/reservations?prosumerNic={nic} to fetch all historical trading records for data aggregation
        progressBar.setVisibility(View.VISIBLE);
        String nic = sessionManager.getNic();

        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this, "reservations?prosumerNic=" + nic).get().build();
                try (Response response = ApiClient.getClient().newCall(request).execute()) {
                    if (response.body() != null) {
                        JSONArray array = new JSONArray(response.body().string());
                        processData(array);
                    }
                }
            } catch (Exception ignored) {
                runOnUiThread(() -> progressBar.setVisibility(View.GONE));
            }
        }).start();
    }

    private void processData(JSONArray array) throws Exception {
        // Aggregate raw reservation records into status counts, weekly energy, monthly totals and node usage
        Map<String, Integer> statusCounts = new HashMap<>();
        Map<String, Float> weeklyEnergy = new LinkedHashMap<>(); // Mon-Sun
        Map<String, Float> monthlyEnergy = new TreeMap<>(); // yyyy-MM
        Map<String, float[]> nodeWeekEnergy = new HashMap<>(); // station -> Sun..Sat kWh, current week

        // Initialize week days
        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        for (String day : days) weeklyEnergy.put(day, 0f);

        Calendar cal = Calendar.getInstance();
        int currentWeek = cal.get(Calendar.WEEK_OF_YEAR);
        int currentYear = cal.get(Calendar.YEAR);

        SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());

        for (int i = 0; i < array.length(); i++) {
            JSONObject item = array.getJSONObject(i);
            String status = item.optString("status");
            String station = item.optString("stationName");
            String isoDate = item.optString("scheduledDateTime");
            float energy = (float) item.optDouble("energyAmountKWh", 0);

            // 1. Status count
            statusCounts.put(status, statusCounts.getOrDefault(status, 0) + 1);

            if (isoDate.length() >= 10) {
                Date date = parser.parse(isoDate);
                cal.setTime(date);

                if ("Completed".equalsIgnoreCase(status)) {
                    // 2. Weekly energy (current week)
                    if (cal.get(Calendar.WEEK_OF_YEAR) == currentWeek && cal.get(Calendar.YEAR) == currentYear) {
                        int dayOfWeek = cal.get(Calendar.DAY_OF_WEEK); // Sun=1, Mon=2...
                        int index = (dayOfWeek + 5) % 7; // Mon=0, Tue=1...Sun=6
                        String dayLabel = days[index];
                        weeklyEnergy.put(dayLabel, weeklyEnergy.get(dayLabel) + energy);

                        // 4. Node weekday heatmap (current week, Sun=0..Sat=6)
                        int sunIndex = dayOfWeek - Calendar.SUNDAY;
                        float[] cells = nodeWeekEnergy.get(station);
                        if (cells == null) {
                            cells = new float[7];
                            nodeWeekEnergy.put(station, cells);
                        }
                        cells[sunIndex] += energy;
                    }

                    // 3. Monthly energy
                    String monthKey = new SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(date);
                    monthlyEnergy.put(monthKey, monthlyEnergy.getOrDefault(monthKey, 0f) + energy);
                }
            }
        }

        runOnUiThread(() -> {
            progressBar.setVisibility(View.GONE);
            setupPieChart(statusCounts);
            setupWeeklyBarChart(weeklyEnergy);
            setupMonthlyChart(monthlyEnergy);
            setupNodeUsageChart(nodeWeekEnergy);
        });
    }

    private void setupPieChart(Map<String, Integer> counts) {
        // Professional monochrome-teal donut: deep = Completed → light = Cancelled
        List<PieEntry> entries = new ArrayList<>();
        List<Integer> colors = new ArrayList<>();

        if (counts.containsKey("Completed")) {
            entries.add(new PieEntry(counts.get("Completed"), "Completed"));
            colors.add(ContextCompat.getColor(this, R.color.chart_teal_500));
        }
        if (counts.containsKey("Approved")) {
            entries.add(new PieEntry(counts.get("Approved"), "Approved"));
            colors.add(ContextCompat.getColor(this, R.color.chart_teal_400));
        }
        if (counts.containsKey("Pending")) {
            entries.add(new PieEntry(counts.get("Pending"), "Pending"));
            colors.add(ContextCompat.getColor(this, R.color.chart_teal_200));
        }
        if (counts.containsKey("Cancelled")) {
            entries.add(new PieEntry(counts.get("Cancelled"), "Cancelled"));
            colors.add(ContextCompat.getColor(this, R.color.chart_teal_100));
        }

        PieDataSet dataSet = new PieDataSet(entries, "");
        dataSet.setColors(colors);
        dataSet.setValueTextColor(Color.WHITE);
        dataSet.setValueTextSize(11f);
        dataSet.setSliceSpace(3f);
        dataSet.setSelectionShift(8f);
        dataSet.setXValuePosition(PieDataSet.ValuePosition.OUTSIDE_SLICE);
        dataSet.setYValuePosition(PieDataSet.ValuePosition.INSIDE_SLICE);
        dataSet.setValueLinePart1Length(0.5f);
        dataSet.setValueLinePart2Length(0.35f);
        dataSet.setValueLineColor(ContextCompat.getColor(this, R.color.neuro_text_muted));

        PieData data = new PieData(dataSet);
        data.setValueFormatter(new PercentFormatter(chartBookingStatus));

        chartBookingStatus.setData(data);
        chartBookingStatus.setUsePercentValues(true);
        chartBookingStatus.getDescription().setEnabled(false);
        chartBookingStatus.setHoleRadius(58f);
        chartBookingStatus.setTransparentCircleRadius(62f);
        chartBookingStatus.setTransparentCircleColor(ContextCompat.getColor(this, R.color.chart_teal_100));
        chartBookingStatus.setTransparentCircleAlpha(60);
        chartBookingStatus.setHoleColor(Color.TRANSPARENT);
        chartBookingStatus.setCenterText("Bookings\nShare");
        chartBookingStatus.setCenterTextSize(13f);
        chartBookingStatus.setCenterTextColor(ContextCompat.getColor(this, R.color.text_brand));
        chartBookingStatus.setEntryLabelColor(ContextCompat.getColor(this, R.color.text_brand));
        chartBookingStatus.setEntryLabelTextSize(11f);
        Legend legend = chartBookingStatus.getLegend();
        legend.setVerticalAlignment(Legend.LegendVerticalAlignment.BOTTOM);
        legend.setHorizontalAlignment(Legend.LegendHorizontalAlignment.CENTER);
        legend.setOrientation(Legend.LegendOrientation.HORIZONTAL);
        legend.setDrawInside(false);
        legend.setTextSize(11f);
        legend.setForm(Legend.LegendForm.CIRCLE);
        legend.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_secondary));
        chartBookingStatus.setExtraOffsets(8f, 8f, 8f, 8f);
        chartBookingStatus.spin(900, 0f, 270f, Easing.EaseOutCubic);
        chartBookingStatus.animateY(1100, Easing.EaseOutCubic);
        chartBookingStatus.invalidate();
    }

    /** Weekly goal fan gauge: share of active days (days with transfers) out of 7. */
    private void setupWeeklyBarChart(Map<String, Float> dataMap) {
        int activeDays = 0;
        float total = 0f;
        for (float v : dataMap.values()) {
            total += v;
            if (v > 0f) activeDays++;
        }
        float fraction = activeDays / 7f;
        int pct = Math.round(fraction * 100f);

        if (gaugeWeekly != null) gaugeWeekly.setFraction(fraction);
        if (tvGaugePct != null) tvGaugePct.setText(pct + "%");
        if (tvWeeklySub != null) {
            tvWeeklySub.setText(String.format(Locale.getDefault(),
                    "%.1f kWh across %d of 7 days", total, activeDays));
        }
    }

    /** Monthly energy share as segmented dash rows like the reference (label + dashes + %). */
    private static final int SEGMENT_COUNT = 24;
    private static final String[] SEGMENT_COLORS = {
            "#BFD5D0", "#8FB3A9", "#65998B", "#3B796A", "#063127" };

    private void setupMonthlyChart(Map<String, Float> dataMap) {
        // Render last 6 months as segmented share bars: label + colored dashes + % share
        if (layoutMonthlySegments == null) return;
        layoutMonthlySegments.removeAllViews();

        List<Map.Entry<String, Float>> entries = new ArrayList<>(dataMap.entrySet());
        // TreeMap is chronological; keep the latest 6 months
        if (entries.size() > 6) entries = entries.subList(entries.size() - 6, entries.size());

        float total = 0f;
        for (Map.Entry<String, Float> e : entries) total += e.getValue();

        if (entries.isEmpty() || total <= 0f) {
            TextView tv = new TextView(this);
            tv.setText("No completed transfers yet.");
            tv.setTextSize(13f);
            try { tv.setTextColor(getResources().getColor(R.color.neuro_text_muted)); }
            catch (Exception ignored) {}
            layoutMonthlySegments.addView(tv);
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
            int color;
            try { color = Color.parseColor(SEGMENT_COLORS[row % SEGMENT_COLORS.length]); }
            catch (Exception ex) { color = Color.parseColor("#3B796A"); }

            layoutMonthlySegments.addView(
                    buildSegmentRow(monthLabel, e.getValue(), pct, color, row));
            row++;
        }
    }

    /** One segmented row: label + kWh on top, dashed bar below, share % on the right. */
    private View buildSegmentRow(String label, float kwh, int pct, int color, int rowIndex) {
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
        tvLabel.setText(label + "  ·  " + String.format(Locale.getDefault(), "%.1f kWh", kwh));
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

    /** Weekday heatmap like the reference: hubs x S M T W T F S, teal intensity scale. */
    private static final String[] HEAT_COLORS = {
            "#BFD5D0", "#8FB3A9", "#65998B", "#3B796A", "#063127" };
    private static final String[] HEAT_DAYS = { "S", "M", "T", "W", "T", "F", "S" };

    private void setupNodeUsageChart(Map<String, float[]> dataMap) {
        // Top 6 hubs by week total, columns Sun..Sat, cell color by kWh bucket
        if (layoutNodeHeatmap == null) return;
        layoutNodeHeatmap.removeAllViews();
        if (layoutNodeLegend != null) layoutNodeLegend.removeAllViews();

        List<Map.Entry<String, float[]>> rows = new ArrayList<>(dataMap.entrySet());
        rows.sort((a, b) -> Float.compare(weekTotal(b.getValue()), weekTotal(a.getValue())));
        if (rows.size() > 6) rows = rows.subList(0, 6);

        float maxCell = 0f;
        for (Map.Entry<String, float[]> r : rows) {
            for (float v : r.getValue()) if (v > maxCell) maxCell = v;
        }

        if (rows.isEmpty() || maxCell <= 0f) {
            TextView tv = new TextView(this);
            tv.setText("No completed transfers this week yet.");
            tv.setTextSize(13f);
            try { tv.setTextColor(getResources().getColor(R.color.neuro_text_muted)); }
            catch (Exception ignored) {}
            layoutNodeHeatmap.addView(tv);
            return;
        }

        renderHeatLegend(maxCell);
        layoutNodeHeatmap.addView(buildHeatHeader());

        int r = 0;
        for (Map.Entry<String, float[]> row : rows) {
            layoutNodeHeatmap.addView(buildHeatRow(row.getKey(), row.getValue(), r, maxCell));
            r++;
        }
    }

    private static float weekTotal(float[] cells) {
        float t = 0f;
        for (float v : cells) t += v;
        return t;
    }

    /** Bucket 0 (zero) -> lightest ... bucket 4 (peak) -> darkest. */
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

    private static String fmtKwh(float v) {
        if (v >= 10f) return String.format(Locale.getDefault(), "%.0f", v);
        return String.format(Locale.getDefault(), "%.1f", v);
    }

    /** Legend swatches with kWh range labels derived from the peak cell. */
    private void renderHeatLegend(float maxCell) {
        if (layoutNodeLegend == null) return;
        String[] labels = {
                "0",
                "≤" + fmtKwh(maxCell * 0.25f),
                "≤" + fmtKwh(maxCell * 0.50f),
                "≤" + fmtKwh(maxCell * 0.75f),
                fmtKwh(maxCell) + " kWh" };
        for (int i = 0; i < HEAT_COLORS.length; i++) {
            LinearLayout chip = new LinearLayout(this);
            chip.setOrientation(LinearLayout.HORIZONTAL);
            chip.setGravity(Gravity.CENTER_VERTICAL);
            LinearLayout.LayoutParams chipParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            if (i > 0) chipParams.leftMargin = dpToPx(10);
            chip.setLayoutParams(chipParams);

            View sw = new View(this);
            LinearLayout.LayoutParams swParams = new LinearLayout.LayoutParams(dpToPx(12), dpToPx(12));
            swParams.rightMargin = dpToPx(4);
            sw.setLayoutParams(swParams);
            try {
                android.graphics.drawable.GradientDrawable bg = new android.graphics.drawable.GradientDrawable();
                bg.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
                bg.setCornerRadius(dpToPx(3));
                bg.setColor(heatColor(i));
                sw.setBackground(bg);
            } catch (Exception ignored) {
                sw.setBackgroundColor(heatColor(i));
            }
            chip.addView(sw);

            TextView tv = new TextView(this);
            tv.setText(labels[i]);
            tv.setTextSize(10f);
            try { tv.setTextColor(getResources().getColor(R.color.neuro_text_secondary)); }
            catch (Exception ignored) {}
            chip.addView(tv);

            layoutNodeLegend.addView(chip);
        }
    }

    /** Day-letter header aligned with the grid columns. */
    private View buildHeatHeader() {
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        TextView corner = new TextView(this);
        corner.setLayoutParams(new LinearLayout.LayoutParams(dpToPx(84), LinearLayout.LayoutParams.WRAP_CONTENT));
        header.addView(corner);

        for (String d : HEAT_DAYS) {
            TextView tv = new TextView(this);
            tv.setText(d);
            tv.setTextSize(10f);
            tv.setGravity(Gravity.CENTER);
            tv.setLayoutParams(new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
            try { tv.setTextColor(getResources().getColor(R.color.neuro_text_muted)); }
            catch (Exception ignored) {}
            header.addView(tv);
        }
        return header;
    }

    /** One hub row: name + 7 intensity cells, buckets relative to the global peak. */
    private View buildHeatRow(String station, float[] cells, int rowIndex, float globalMax) {
        LinearLayout rowBox = new LinearLayout(this);
        rowBox.setOrientation(LinearLayout.HORIZONTAL);
        rowBox.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams boxParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        boxParams.topMargin = dpToPx(8);
        rowBox.setLayoutParams(boxParams);

        TextView tvName = new TextView(this);
        String shortName = station == null ? "Hub" : station;
        if (shortName.length() > 12) shortName = shortName.substring(0, 11) + "…";
        tvName.setText(shortName);
        tvName.setTextSize(12f);
        tvName.setTypeface(null, Typeface.BOLD);
        tvName.setMaxLines(1);
        tvName.setEllipsize(android.text.TextUtils.TruncateAt.END);
        tvName.setLayoutParams(new LinearLayout.LayoutParams(
                dpToPx(84), LinearLayout.LayoutParams.WRAP_CONTENT));
        try { tvName.setTextColor(getResources().getColor(R.color.neuro_text_primary)); }
        catch (Exception ignored) {}
        rowBox.addView(tvName);

        // Buckets use the global peak so intensity is comparable across rows.
        float scaleMax = globalMax <= 0f ? 1f : globalMax;
        for (int d = 0; d < 7; d++) {
            float v = d < cells.length ? cells[d] : 0f;
            View cell = new View(this);
            LinearLayout.LayoutParams cellParams = new LinearLayout.LayoutParams(
                    0, dpToPx(26), 1f);
            if (d < 6) cellParams.rightMargin = dpToPx(5);
            cell.setLayoutParams(cellParams);
            try {
                android.graphics.drawable.GradientDrawable bg = new android.graphics.drawable.GradientDrawable();
                bg.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
                bg.setCornerRadius(dpToPx(6));
                bg.setColor(heatColor(heatBucket(v, scaleMax)));
                cell.setBackground(bg);
            } catch (Exception ignored) {
                cell.setBackgroundColor(heatColor(heatBucket(v, scaleMax)));
            }
            rowBox.addView(cell);
        }

        rowBox.setAlpha(0f);
        rowBox.setTranslationY(dpToPx(8));
        rowBox.animate().alpha(1f).translationY(0f)
                .setDuration(300)
                .setStartDelay(Math.min(rowIndex, 6) * 80L)
                .start();
        return rowBox;
    }

    @Override
    protected void onDestroy() {
        // Release session manager resources on activity teardown
        super.onDestroy();
        if (sessionManager != null) sessionManager.close();
    }
}
