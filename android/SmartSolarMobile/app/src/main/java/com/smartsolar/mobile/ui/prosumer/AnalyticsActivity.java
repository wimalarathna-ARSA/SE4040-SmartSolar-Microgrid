// ============================================================================
// File: AnalyticsActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Prosumer energy trading and savings analytics dashboard.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.os.Bundle;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;

public class AnalyticsActivity extends AppCompatActivity {

    private View progressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_analytics);

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());
        progressBar = findViewById(R.id.progress_bar);
    }
}