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
}