// ============================================================================
// File: AnalyticsActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Prosumer energy trading and savings analytics visualization dashboard.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.github.mikephil.charting.charts.*;
import com.github.mikephil.charting.components.XAxis;
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
    private BarChart chartWeeklyEnergy;
    private HorizontalBarChart chartMonthlySummary;
    private LineChart chartNodeUsage;
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
        chartWeeklyEnergy  = findViewById(R.id.chart_weekly_energy);
        chartMonthlySummary = findViewById(R.id.chart_monthly_summary);
        chartNodeUsage     = findViewById(R.id.chart_node_usage);
        progressBar        = findViewById(R.id.progress_bar);

        loadAnalyticsData();
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
        Map<String, Integer> nodeUsage = new HashMap<>();

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

            // 4. Node usage
            nodeUsage.put(station, nodeUsage.getOrDefault(station, 0) + 1);

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
            setupNodeUsageChart(nodeUsage);
        });
    }

    private void setupPieChart(Map<String, Integer> counts) {
        // Configure MPAndroidChart PieChart with status slice colours, percentages and hole styling
        List<PieEntry> entries = new ArrayList<>();
        List<Integer> colors = new ArrayList<>();
        
        if (counts.containsKey("Completed")) {
            entries.add(new PieEntry(counts.get("Completed"), "Completed"));
            colors.add(ContextCompat.getColor(this, R.color.neuro_green));
        }
        if (counts.containsKey("Approved")) {
            entries.add(new PieEntry(counts.get("Approved"), "Approved"));
            colors.add(ContextCompat.getColor(this, R.color.neuro_blue));
        }
        if (counts.containsKey("Pending")) {
            entries.add(new PieEntry(counts.get("Pending"), "Pending"));
            colors.add(ContextCompat.getColor(this, R.color.neuro_amber));
        }
        if (counts.containsKey("Cancelled")) {
            entries.add(new PieEntry(counts.get("Cancelled"), "Cancelled"));
            colors.add(ContextCompat.getColor(this, R.color.neuro_danger));
        }

        PieDataSet dataSet = new PieDataSet(entries, "");
        dataSet.setColors(colors);
        dataSet.setValueTextColor(Color.WHITE);
        dataSet.setValueTextSize(12f);
        dataSet.setSliceSpace(3f);

        PieData data = new PieData(dataSet);
        data.setValueFormatter(new PercentFormatter(chartBookingStatus));
        
        chartBookingStatus.setData(data);
        chartBookingStatus.setUsePercentValues(true);
        chartBookingStatus.getDescription().setEnabled(false);
        chartBookingStatus.setHoleRadius(45f);
        chartBookingStatus.setTransparentCircleRadius(50f);
        chartBookingStatus.setHoleColor(Color.TRANSPARENT);
        chartBookingStatus.getLegend().setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
        chartBookingStatus.animateY(1000);
        chartBookingStatus.invalidate();
    }

    private void setupWeeklyBarChart(Map<String, Float> dataMap) {
        // Configure BarChart showing daily energy trading volume (kWh) across the current calendar week
        List<BarEntry> entries = new ArrayList<>();
        List<String> labels = new ArrayList<>();
        int index = 0;
        for (Map.Entry<String, Float> entry : dataMap.entrySet()) {
            entries.add(new BarEntry(index, entry.getValue()));
            labels.add(entry.getKey());
            index++;
        }

        BarDataSet dataSet = new BarDataSet(entries, "Energy (kWh)");
        dataSet.setColor(ContextCompat.getColor(this, R.color.neuro_green));
        dataSet.setValueTextColor(ContextCompat.getColor(this, R.color.neuro_text_primary));

        BarData data = new BarData(dataSet);
        data.setBarWidth(0.6f);
        
        chartWeeklyEnergy.setData(data);
        chartWeeklyEnergy.getDescription().setEnabled(false);
        chartWeeklyEnergy.getLegend().setEnabled(false);

        XAxis xAxis = chartWeeklyEnergy.getXAxis();
        xAxis.setValueFormatter(new IndexAxisValueFormatter(labels));
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));

        chartWeeklyEnergy.getAxisLeft().setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
        chartWeeklyEnergy.getAxisLeft().setGridColor(ContextCompat.getColor(this, R.color.neuro_shadow_light));
        chartWeeklyEnergy.getAxisLeft().setGridLineWidth(1f);
        chartWeeklyEnergy.getAxisRight().setEnabled(false);
        chartWeeklyEnergy.animateY(1000);
        chartWeeklyEnergy.invalidate();
    }

    private void setupMonthlyChart(Map<String, Float> dataMap) {
        // Configure HorizontalBarChart showing historical monthly aggregated trading volumes
        List<BarEntry> entries = new ArrayList<>();
        List<String> labels = new ArrayList<>();
        int index = 0;
        
        // Show last 6 months or whatever we have
        for (Map.Entry<String, Float> entry : dataMap.entrySet()) {
            entries.add(new BarEntry(index, entry.getValue()));
            // Convert 2024-09 to Sep
            try {
                Date d = new SimpleDateFormat("yyyy-MM", Locale.getDefault()).parse(entry.getKey());
                labels.add(new SimpleDateFormat("MMM", Locale.getDefault()).format(d));
            } catch (Exception e) { labels.add(entry.getKey()); }
            index++;
        }

        BarDataSet dataSet = new BarDataSet(entries, "Total Energy");
        dataSet.setColor(ContextCompat.getColor(this, R.color.neuro_blue));
        dataSet.setValueTextColor(ContextCompat.getColor(this, R.color.neuro_text_primary));

        BarData data = new BarData(dataSet);
        chartMonthlySummary.setData(data);
        chartMonthlySummary.getDescription().setEnabled(false);

        XAxis xAxis = chartMonthlySummary.getXAxis();
        xAxis.setValueFormatter(new IndexAxisValueFormatter(labels));
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
        
        chartMonthlySummary.getAxisLeft().setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
        chartMonthlySummary.getAxisLeft().setGridColor(ContextCompat.getColor(this, R.color.neuro_shadow_light));
        chartMonthlySummary.getAxisLeft().setGridLineWidth(1f);
        chartMonthlySummary.getAxisRight().setEnabled(false);
        chartMonthlySummary.animateY(1000);
        chartMonthlySummary.invalidate();
    }

    private void setupNodeUsageChart(Map<String, Integer> dataMap) {
        // Configure LineChart displaying top 5 microgrid nodes utilised by the prosumer with bezier curves
        List<Entry> entries = new ArrayList<>();
        List<String> labels = new ArrayList<>();
        
        // Sort by value descending
        List<Map.Entry<String, Integer>> list = new ArrayList<>(dataMap.entrySet());
        list.sort((e1, e2) -> e2.getValue().compareTo(e1.getValue()));

        int index = 0;
        for (Map.Entry<String, Integer> entry : list) {
            if (index >= 5) break; 
            entries.add(new Entry(index, entry.getValue().floatValue()));
            labels.add(entry.getKey());
            index++;
        }

        if (entries.isEmpty()) return;

        LineDataSet dataSet = new LineDataSet(entries, "Node Utilization");
        dataSet.setColor(ContextCompat.getColor(this, R.color.neuro_green)); // pastel aqua line
        dataSet.setCircleColor(ContextCompat.getColor(this, R.color.neuro_green));
        dataSet.setLineWidth(2.5f);
        dataSet.setCircleRadius(4f);
        dataSet.setDrawCircleHole(false);
        dataSet.setMode(LineDataSet.Mode.CUBIC_BEZIER);
        dataSet.setDrawFilled(false); // line only — no area fill
        dataSet.setDrawValues(true);
        dataSet.setValueTextColor(ContextCompat.getColor(this, R.color.neuro_text_secondary));

        LineData data = new LineData(dataSet);
        chartNodeUsage.setData(data);
        chartNodeUsage.getDescription().setEnabled(false);
        chartNodeUsage.getLegend().setEnabled(false);
        
        XAxis xAxis = chartNodeUsage.getXAxis();
        xAxis.setValueFormatter(new IndexAxisValueFormatter(labels));
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setDrawAxisLine(false);
        xAxis.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
        xAxis.setLabelRotationAngle(-35f); 
        xAxis.setGranularity(1f);
        
        chartNodeUsage.getAxisLeft().setDrawGridLines(false);
        chartNodeUsage.getAxisLeft().setDrawAxisLine(false);
        chartNodeUsage.getAxisLeft().setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
        chartNodeUsage.getAxisRight().setEnabled(false);
        
        chartNodeUsage.setExtraBottomOffset(30f);
        chartNodeUsage.animateX(1200);
        chartNodeUsage.invalidate();
    }

    @Override
    protected void onDestroy() {
        // Release session manager resources on activity teardown
        super.onDestroy();
        if (sessionManager != null) sessionManager.close();
    }
}
