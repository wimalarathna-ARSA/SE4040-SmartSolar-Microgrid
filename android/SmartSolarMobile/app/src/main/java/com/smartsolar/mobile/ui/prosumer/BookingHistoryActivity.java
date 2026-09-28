// ============================================================================
// File: BookingHistoryActivity.java
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Prosumer booking history list with 4 status tabs, real-time search filter, and localized timestamps.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.data.SessionManager;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class BookingHistoryActivity extends AppCompatActivity {

    private EditText etSearch;
    private RecyclerView recyclerView;
    private TextView tvEmpty, tvTotalTraded, tvTotalValue;
    private View progressBar;
    private SessionManager sessionManager;
    private List<JSONObject> bookingList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_history);

        sessionManager = new SessionManager(this);

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());

        etSearch      = findViewById(R.id.et_search);
        recyclerView  = findViewById(R.id.recycler_bookings);
        tvEmpty       = findViewById(R.id.tv_empty);
        tvTotalTraded = findViewById(R.id.tv_total_traded);
        tvTotalValue  = findViewById(R.id.tv_total_value);
        progressBar   = findViewById(R.id.progress_bar);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
    }
}