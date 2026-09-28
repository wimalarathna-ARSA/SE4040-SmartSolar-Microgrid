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

    /** Renders the processed JSON payload matching operational data structures */
    private void updateUI(JSONObject b) {
        // Populate booking details, status badge colour, and settled transaction parameters from JSON
        if (b == null) return;

        try {
            // 1. Map Booking Information
            String code = b.optString("reservationCode", "RES-PENDING");
            String pName = b.optString("prosumerName", "Prosumer Agent");
            String pNic  = b.optString("prosumerNic", "N/A");
            String node  = b.optString("stationName", "Solar Microgrid Hub");
            String time  = b.optString("scheduledDateTime", "").replace("T", " ").substring(0, 16);
            String status = b.optString("status", "Pending");

            tvBookingCode.setText("Ref: " + code);
            tvProsumerName.setText("Prosumer: " + pName);
            tvProsumerNic.setText("NIC/Ref: " + pNic);
            tvNodeName.setText("Node: " + node);
            tvScheduledTime.setText("Scheduled: " + time);
            tvBookingStatus.setText("BOOKING STATUS: " + status.toUpperCase());

            // Status color logic (Authoritative API reflection)
            if ("Completed".equalsIgnoreCase(status)) {
                tvBookingStatus.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.neuro_green_bg));
                tvBookingStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_green_dark));
            } else if ("Pending".equalsIgnoreCase(status)) {
                tvBookingStatus.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.neuro_amber_bg));
                tvBookingStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_amber));
            } else if ("Cancelled".equalsIgnoreCase(status)) {
                tvBookingStatus.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.neuro_danger_bg));
                tvBookingStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_danger_dark));
            } else {
                tvBookingStatus.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.neuro_blue_bg));
                tvBookingStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_blue));
            }

            // 2. Map Transaction Information
            // In this architecture, transaction fields are flattened or linked within the reservation object
            // A transaction is authoritatively present if the status is 'Completed'
            boolean hasTransaction = "Completed".equalsIgnoreCase(status);
            
            if (hasTransaction) {
                tvTransactionEmpty.setVisibility(View.GONE);
                containerTransactionDetails.setVisibility(View.VISIBLE);

                // Use the booking ID as the transaction reference if no explicit TxID exists
                tvTransactionId.setText("Tx Reference: TXN-" + bookingId.toUpperCase().substring(0, 8));
                tvTransactionStatus.setText("SUCCESSFUL / SETTLED");
                tvTransactionStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));

                double energy = b.optDouble("energyAmountKWh", 0.0);
                tvEnergyAmount.setText(String.format(Locale.getDefault(), "%.2f kWh", energy));

                String qrData = b.optString("qrCodeData", "N/A");
                tvQrReference.setText(qrData);

            } else {
                tvTransactionEmpty.setVisibility(View.VISIBLE);
                containerTransactionDetails.setVisibility(View.GONE);
            }

        } catch (Exception ignored) {}
    }
}