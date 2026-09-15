// ============================================================================
// File: OperatorTransactionDetailActivity.java
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Read-only historical transaction audit view for Grid Operators.
//              Displays finalized settlement metrics and historical QR reference.
// Architecture: FAT Service Pattern - Authoritative data from C# Web API
// ============================================================================
package com.smartsolar.mobile.ui.operator;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.google.zxing.BarcodeFormat;
import com.journeyapps.barcodescanner.BarcodeEncoder;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import okhttp3.*;
import org.json.JSONObject;

import java.util.Locale;

/** Historical transaction archive viewer for Grid Operators. */
public class OperatorTransactionDetailActivity extends AppCompatActivity {

    private String bookingId;
    private View progressBar;
    private TextView tvTransactionTitle, tvTransactionBanner;

    // ── Booking Fields ─────────────────────────────────────────────────────
    private TextView tvBookingId, tvProsumerName, tvProsumerNic, tvNodeName, tvScheduledTime;

    // ── Transaction Fields ──────────────────────────────────────────────────
    private TextView tvTransactionId, tvTransactionStatus, tvEnergyTransferred, tvCompletionTime, tvQrPayload, tvQrHeaderLabel, tvQrSubLabel;
    private ImageView ivHistoricalQr;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Retrieve booking ID from intent, bind views, wire header back button, and load record
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_operator_transaction_detail);

        bookingId = getIntent().getStringExtra("booking_id");
        if (bookingId == null || bookingId.isEmpty()) {
            Toast.makeText(this, "History Error: Missing record identifier.", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        bindViews();

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());

        fetchHistoricalData();
    }

    private void bindViews() {
        // Map all origin booking, financial settlement, and historical QR code display views
        progressBar          = findViewById(R.id.progress_bar);
        tvTransactionTitle   = findViewById(R.id.tv_transaction_title);
        tvTransactionBanner  = findViewById(R.id.tv_transaction_banner);

        // Origin section
        tvBookingId          = findViewById(R.id.tv_booking_id);
        tvProsumerName       = findViewById(R.id.tv_prosumer_name);
        tvProsumerNic        = findViewById(R.id.tv_prosumer_nic);
        tvNodeName           = findViewById(R.id.tv_node_name);
        tvScheduledTime      = findViewById(R.id.tv_scheduled_time);

        // Settlement section
        tvTransactionId      = findViewById(R.id.tv_transaction_id);
        tvTransactionStatus  = findViewById(R.id.tv_transaction_status);
        tvEnergyTransferred  = findViewById(R.id.tv_energy_transferred);
        tvCompletionTime     = findViewById(R.id.tv_completion_time);
        
        // QR section
        tvQrPayload          = findViewById(R.id.tv_qr_payload);
        ivHistoricalQr       = findViewById(R.id.iv_historical_qr);
        tvQrHeaderLabel      = findViewById(R.id.tv_qr_header_label);
        tvQrSubLabel         = findViewById(R.id.tv_qr_sub_label);
    }

    /** Polls the authoritative historical database logs from C# Web API */
    private void fetchHistoricalData() {
        // GET /api/reservations/{id} to retrieve immutable historical transaction record
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
                            renderHistoricalRecord(json);
                        });
                    }
                }
            } catch (Exception e) {
                runOnUiThread(() -> {
                    if (progressBar != null) progressBar.setVisibility(View.GONE);
                    Toast.makeText(this, "Archive Access Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
            }
        }).start();
    }

    /** Renders immutable historical data payload */
    private void renderHistoricalRecord(JSONObject b) {
        // Populate origin booking details, settlement metrics, and trigger QR image generation
        if (b == null) return;

        try {
            String status = b.optString("status", "Completed");

            // 1. Origin Information (Booking context)
            String resCode = b.optString("reservationCode", "RES-HISTORICAL");
            tvBookingId.setText("Booking Reference: " + resCode);
            tvProsumerName.setText("Prosumer Agent: " + b.optString("prosumerName", "Unknown"));
            tvProsumerNic.setText("NIC / Identifier: " + b.optString("prosumerNic", "N/A"));
            tvNodeName.setText("Operational Node: " + b.optString("stationName", "Solar Hub"));
            
            String sTime = b.optString("scheduledDateTime", "").replace("T", " ").substring(0, 16);
            tvScheduledTime.setText("Originally Scheduled: " + sTime);

            // 2. Transaction Parameters (Settlement context)
            // TxID is derived from Booking ID in this architecture for historical mapping
            String txId = "TXN-" + bookingId.toUpperCase().substring(0, 8);
            tvTransactionId.setText("TRANSACTION ID: " + txId);
            
            double energy = b.optDouble("energyAmountKWh", 0.0);
            tvEnergyTransferred.setText(String.format(Locale.getDefault(), "%.2f kWh", energy));

            // Using scheduled time as completion approximation if explicit timestamp missing
            tvCompletionTime.setText(sTime);

            // 3. Historical QR Reference
            String qrData = b.optString("qrCodeData", "");

            if ("Approved".equalsIgnoreCase(status)) {
                if (tvQrHeaderLabel != null) tvQrHeaderLabel.setText("QR REFERENCE (CURRENT)");
                if (tvQrSubLabel != null) tvQrSubLabel.setText("ACTIVE TRANSACTION QR");
                if (tvTransactionTitle != null) tvTransactionTitle.setText("Approved Transaction");
                if (tvTransactionBanner != null) tvTransactionBanner.setText("ACTIVE TRANSACTION RECORD (READ-ONLY)");
            } else {
                if (tvQrHeaderLabel != null) tvQrHeaderLabel.setText("QR REFERENCE (HISTORICAL)");
                if (tvQrSubLabel != null) tvQrSubLabel.setText("COMPLETED TRANSACTION QR");
                if (tvTransactionTitle != null) tvTransactionTitle.setText("Historical Transaction");
                if (tvTransactionBanner != null) tvTransactionBanner.setText("HISTORICAL TRANSACTION RECORD (READ-ONLY)");
            }

            if (!qrData.isEmpty()) {
                tvQrPayload.setText(qrData);
                renderQr(qrData);
            } else {
                tvQrPayload.setText("NO QR PAYLOAD LOGGED");
            }

        } catch (Exception ignored) {}
    }

    /** Renders the historical QR reference visually using ZXing */
    private void renderQr(String data) {
        // Use ZXing BarcodeEncoder to generate and render 400x400 QR code bitmap from payload
        try {
            BarcodeEncoder encoder = new BarcodeEncoder();
            Bitmap bitmap = encoder.encodeBitmap(data, BarcodeFormat.QR_CODE, 400, 400);
            ivHistoricalQr.setImageBitmap(bitmap);
        } catch (Exception e) {
            Toast.makeText(this, "QR Rendering Failed", Toast.LENGTH_SHORT).show();
        }
    }
}