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

    /** Loads reservation records for the authenticated prosumer. */
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

                        runOnUiThread(() ->
                                progressBar.setVisibility(View.GONE));
                    }
                }
            } catch (Exception ignored) {
                runOnUiThread(() ->
                        progressBar.setVisibility(View.GONE));
            }
        }).start();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        if (sessionManager != null) {
            sessionManager.close();
        }
    }
}