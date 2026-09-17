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
    }