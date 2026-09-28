// ============================================================================
// File: QrScannerActivity.java
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator QR code scanner using ZXing camera integration.
//              Scans prosumer's transaction QR code, verifies against C# Web API,
//              and finalizes the energy transfer job upon successful verification.
// Architecture: FAT Service Pattern - Verification and completion in C# Web API
// ============================================================================
package com.smartsolar.mobile.ui.operator;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.button.MaterialButton;
import com.journeyapps.barcodescanner.ScanContract;
import com.journeyapps.barcodescanner.ScanIntentResult;
import com.journeyapps.barcodescanner.ScanOptions;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.SessionManager;
import androidx.activity.result.ActivityResultLauncher;
import okhttp3.*;
import org.json.JSONObject;

/** QR Scanner and job finalization screen for Grid Operators. */
public class QrScannerActivity extends AppCompatActivity {

    private EditText etQrManual, etOperatorNotes;
    private TextView tvScanResult, tvError, tvSuccess;
    private MaterialButton btnScanCamera, btnVerifyFinalize;
    private View progressBar;
    private SessionManager sessionManager;
    private String scannedQrData = "";

    // ZXing activity result launcher for camera scanning
    private final ActivityResultLauncher<ScanOptions> qrLauncher = registerForActivityResult(
            new ScanContract(), this::onQrScanResult);

    /** Initializes QR scanner UI with camera and manual entry options. */
    // Sets up ZXing scanner launcher and verify button
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Initialise session, bind views, configure ZXing camera launcher and verify click handler
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_qr_scanner);

        sessionManager = new SessionManager(this);

        etQrManual     = findViewById(R.id.et_qr_manual);
        etOperatorNotes = findViewById(R.id.et_operator_notes);
        tvScanResult   = findViewById(R.id.tv_scan_result);
        tvError        = findViewById(R.id.tv_error);
        tvSuccess      = findViewById(R.id.tv_success);
        btnScanCamera  = findViewById(R.id.btn_scan_camera);
        btnVerifyFinalize = findViewById(R.id.btn_verify_finalize);
        progressBar    = findViewById(R.id.progress_bar);

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());

        // Launch ZXing camera QR scanner
        btnScanCamera.setOnClickListener(v -> {
            ScanOptions options = new ScanOptions();
            options.setPrompt("Scan Prosumer Transaction QR Code");
            options.setBeepEnabled(true);
            options.setOrientationLocked(true);
            options.setBarcodeImageEnabled(false);
            qrLauncher.launch(options);
        });

        // Verify and finalize job with API
        btnVerifyFinalize.setOnClickListener(v -> {
            scannedQrData = etQrManual.getText().toString().trim().isEmpty()
                    ? scannedQrData : etQrManual.getText().toString().trim();
            if (scannedQrData.isEmpty()) {
                tvError.setText("Please scan or enter a QR code.");
                tvError.setVisibility(View.VISIBLE);
                return;
            }
            verifyAndFinalizeJob();
        });
    }

    /** Handles ZXing scan result and populates QR field. */
    // Called by ZXing after camera capture with decoded string
    private void onQrScanResult(ScanIntentResult result) {
        // Receive decoded barcode payload from ZXing scanner and update input fields
        if (result.getContents() != null) {
            scannedQrData = result.getContents();
            etQrManual.setText(scannedQrData);
            tvScanResult.setText("QR Scanned: " + scannedQrData);
            tvScanResult.setVisibility(View.VISIBLE);
            tvError.setVisibility(View.GONE);
        }
    }

    /** Verifies QR code against central C# Web API and finalizes energy transfer job. */
    // Calls POST /api/reservations/verify-qr?operatorNic=... with QR payload
    private void verifyAndFinalizeJob() {
        // POST /api/reservations/verify-qr with QR payload and operator notes to finalize job
        progressBar.setVisibility(View.VISIBLE);
        btnVerifyFinalize.setEnabled(false);
        tvError.setVisibility(View.GONE);
        tvSuccess.setVisibility(View.GONE);

        String operatorNic = sessionManager.getNic();
        String notes = etOperatorNotes.getText().toString().trim();
        if (notes.isEmpty()) notes = "Physical battery inspection passed. Energy transfer completed by Grid Operator.";

        final String finalNotes = notes;

        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("qrCodeData", scannedQrData);
                body.put("operatorNotes", finalNotes);

                Request request = ApiClient.buildAuthRequest(this,
                        "reservations/verify-qr?operatorNic=" + operatorNic)
                        .post(ApiClient.jsonBody(body)).build();

                Response response = ApiClient.getClient().newCall(request).execute();
                String responseBody = response.body().string();
                JSONObject json = new JSONObject(responseBody);

                if (response.isSuccessful()) {
                    JSONObject res = json.optJSONObject("reservation");
                    String code = res != null ? res.optString("reservationCode") : "";
                    String name = res != null ? res.optString("prosumerName") : "";
                    double energy = res != null ? res.optDouble("energyAmountKWh") : 0;
                    double cost = res != null ? res.optDouble("totalCost") : 0;

                    runOnUiThread(() -> {
                        progressBar.setVisibility(View.GONE);
                        btnVerifyFinalize.setEnabled(true);
                        tvSuccess.setText("Job finalized.\n" +
                                "Booking: " + code + "\n" +
                                "Prosumer: " + name + "\n" +
                                "Energy Transferred: " + energy + " kWh\n" +
                                "Transaction Value: Rs. " + String.format("%.2f", cost));
                        tvSuccess.setVisibility(View.VISIBLE);
                        etQrManual.setText("");
                        scannedQrData = "";
                    });
                } else {
                    String msg = json.optString("message", "QR verification failed.");
                    runOnUiThread(() -> {
                        progressBar.setVisibility(View.GONE);
                        btnVerifyFinalize.setEnabled(true);
                        tvError.setText("Verification Failed: " + msg);
                        tvError.setVisibility(View.VISIBLE);
                    });
                }
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    btnVerifyFinalize.setEnabled(true);
                    tvError.setText("Network error: " + e.getMessage());
                    tvError.setVisibility(View.VISIBLE);
                });
            }
        }).start();
    }
}