// ============================================================================
// File: OperatorBookingDetailActivity.java
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Detailed operational audit screen for Grid Operators to inspect
//              booking entities and associated transaction telemetry.
// Architecture: FAT Service Pattern - State validation via C# Web API
// ============================================================================
package com.smartsolar.mobile.ui.operator;

import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import okhttp3.*;
import org.json.JSONObject;

import java.util.Locale;

/** Operational oversight panel for verifying reservation and transaction integrity. */
public class OperatorBookingDetailActivity extends AppCompatActivity {

    private String bookingId;
    private View progressBar;

    // ── Booking Entity Views ───────────────────────────────────────────────
    private TextView tvBookingCode, tvProsumerName, tvProsumerNic, tvNodeName, tvScheduledTime, tvBookingStatus;

    // ── Transaction Telemetry Views ─────────────────────────────────────────
    private View containerTransactionDetails;
    private TextView tvTransactionEmpty, tvTransactionId, tvTransactionStatus, tvEnergyAmount, tvQrReference;

        @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Extract booking ID from intent, bind views, wire back button, and start data fetch
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_operator_booking_detail);

        bookingId = getIntent().getStringExtra("booking_id");
        if (bookingId == null || bookingId.isEmpty()) {
            Toast.makeText(this, "Operation Error: Missing booking identifier.", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        bindViews();

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());
        findViewById(R.id.btn_refresh).setOnClickListener(v -> fetchBookingData());

        fetchBookingData();
    }

    private void bindViews() {
        // Map all booking entity and transaction telemetry TextView references from layout XML
        progressBar          = findViewById(R.id.progress_bar);

        // Booking fields
        tvBookingCode        = findViewById(R.id.tv_booking_code);
        tvProsumerName       = findViewById(R.id.tv_prosumer_name);
        tvProsumerNic        = findViewById(R.id.tv_prosumer_nic);
        tvNodeName           = findViewById(R.id.tv_node_name);
        tvScheduledTime      = findViewById(R.id.tv_scheduled_time);
        tvBookingStatus      = findViewById(R.id.tv_booking_status);

        // Transaction fields
        tvTransactionEmpty         = findViewById(R.id.tv_transaction_empty);
        containerTransactionDetails = findViewById(R.id.container_transaction_details);
        tvTransactionId            = findViewById(R.id.tv_transaction_id);
        tvTransactionStatus        = findViewById(R.id.tv_transaction_status);
        tvEnergyAmount             = findViewById(R.id.tv_energy_amount);
        tvQrReference              = findViewById(R.id.tv_qr_reference);
    }

    /** Polls the C# Web API for the latest authoritative state of the booking object */
    private void fetchBookingData() {
        // GET /api/reservations/{id} to retrieve authoritative booking and transaction telemetry
        if (progressBar != null) progressBar.setVisibility(View.VISIBLE);

        new Thread(() -> {
            try {
                Request req = ApiClient.buildAuthRequest(this, "reservations/" + bookingId).get().build();
                try (Response res = ApiClient.getClient().newCall(req).execute()) {
                    if (res.body() != null) {
                        String payload = res.body().string();
                        JSONObject json = new JSONObject(payload);

                        runOnUiThread(() -> {
                            if (progressBar != null) progressBar.setVisibility(View.GONE);
                            updateUI(json);
                        });
                    }
                }
            } catch (Exception e) {
                runOnUiThread(() -> {
                    if (progressBar != null) progressBar.setVisibility(View.GONE);
                    Toast.makeText(this, "Telemetry Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
            }
        }).start();
    }

}