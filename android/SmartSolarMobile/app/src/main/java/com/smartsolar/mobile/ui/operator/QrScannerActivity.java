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

    
}