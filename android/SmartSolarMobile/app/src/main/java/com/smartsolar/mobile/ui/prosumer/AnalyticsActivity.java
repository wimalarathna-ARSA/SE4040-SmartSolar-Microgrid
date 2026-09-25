// ============================================================================
// File: AnalyticsActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Prosumer energy trading and savings analytics visualization dashboard.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.os.Bundle;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.SessionManager;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.*;

public class AnalyticsActivity extends AppCompatActivity {

    private View progressBar;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_analytics);

        sessionManager = new SessionManager(this);

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());
        progressBar = findViewById(R.id.progress_bar);

        loadAnalyticsData();
    }

    private void loadAnalyticsData() {
        progressBar.setVisibility(View.VISIBLE);

        String nic = sessionManager.getNic();

        new Thread(() -> {
            try {
                Request request = ApiClient
                        .buildAuthRequest(
                                this,
                                "reservations?prosumerNic=" + nic
                        )
                        .get()
                        .build();

                try (Response response =
                             ApiClient.getClient().newCall(request).execute()) {

                    if (response.body() != null) {
                        JSONArray array =
                                new JSONArray(response.body().string());

                        processData(array);
                    }
                }
            } catch (Exception ignored) {
                runOnUiThread(() ->
                        progressBar.setVisibility(View.GONE));
            }
        }).start();
    }

    /** Aggregates reservation records into dashboard analytics. */
    private void processData(JSONArray array) throws Exception {

        Map<String, Integer> statusCounts = new HashMap<>();
        Map<String, Float> weeklyEnergy = new LinkedHashMap<>();
        Map<String, Float> monthlyEnergy = new TreeMap<>();
        Map<String, Integer> nodeUsage = new HashMap<>();

        String[] days = {
                "Mon", "Tue", "Wed", "Thu",
                "Fri", "Sat", "Sun"
        };

        for (String day : days) {
            weeklyEnergy.put(day, 0f);
        }

        Calendar cal = Calendar.getInstance();
        int currentWeek = cal.get(Calendar.WEEK_OF_YEAR);
        int currentYear = cal.get(Calendar.YEAR);

        SimpleDateFormat parser =
                new SimpleDateFormat(
                        "yyyy-MM-dd'T'HH:mm:ss",
                        Locale.getDefault()
                );

        for (int i = 0; i < array.length(); i++) {

            JSONObject item = array.getJSONObject(i);

            String status = item.optString("status");
            String station = item.optString("stationName");
            String isoDate = item.optString("scheduledDateTime");

            float energy =
                    (float) item.optDouble("energyAmountKWh", 0);

            statusCounts.put(
                    status,
                    statusCounts.getOrDefault(status, 0) + 1
            );

            nodeUsage.put(
                    station,
                    nodeUsage.getOrDefault(station, 0) + 1
            );

            if (isoDate.length() >= 10) {

                Date date = parser.parse(isoDate);
                if (date == null) continue;

                cal.setTime(date);

                if ("Completed".equalsIgnoreCase(status)) {

                    if (cal.get(Calendar.WEEK_OF_YEAR) == currentWeek
                            && cal.get(Calendar.YEAR) == currentYear) {

                        int dayOfWeek =
                                cal.get(Calendar.DAY_OF_WEEK);

                        int index =
                                (dayOfWeek + 5) % 7;

                        String dayLabel = days[index];

                        weeklyEnergy.put(
                                dayLabel,
                                weeklyEnergy.get(dayLabel) + energy
                        );
                    }

                    String monthKey =
                            new SimpleDateFormat(
                                    "yyyy-MM",
                                    Locale.getDefault()
                            ).format(date);

                    monthlyEnergy.put(
                            monthKey,
                            monthlyEnergy.getOrDefault(monthKey, 0f)
                                    + energy
                    );
                }
            }
        }

        runOnUiThread(() ->
                progressBar.setVisibility(View.GONE));
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        if (sessionManager != null) {
            sessionManager.close();
        }
    }
}