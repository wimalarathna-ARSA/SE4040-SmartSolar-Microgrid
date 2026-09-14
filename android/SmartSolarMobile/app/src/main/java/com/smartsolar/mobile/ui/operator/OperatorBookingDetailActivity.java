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
