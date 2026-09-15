// ============================================================================
// File: OperatorMainActivity.java
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator home screen showing live station battery slot metrics
//              and active booking counts. Features persistent bottom navigation.
// Architecture: FAT Service Pattern - All data from central C# Web API
// ============================================================================
package com.smartsolar.mobile.ui.operator;

import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.*;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.button.MaterialButton;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.SessionManager;
import com.smartsolar.mobile.data.OnboardingPrefs;
import com.smartsolar.mobile.ui.auth.LoginActivity;
import com.smartsolar.mobile.ui.auth.OnboardingActivity;
import com.smartsolar.mobile.ui.prosumer.SettingsActivity;

import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.osmdroid.config.Configuration;
import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/** Grid Operator console with live station metrics, persistent bottom nav, and QR verification access. */
public class OperatorMainActivity extends AppCompatActivity {

    private TextView tvStationCount, tvActiveBookings, tvApprovedFuture, tvCompletedJobs;
    private LinearLayout layoutStations, layoutTodayBookings;
    private View progressBar;
    private SessionManager sessionManager;

    // ── Section Container Views ──────────────────────────────────────────────
    private View viewHome, viewNodes, viewBookings, viewHistory, viewProfile;

    // ── Bottom Navigation Tab Layouts ─────────────────────────────────────────
    private LinearLayout navHome, navNodes, navBookings, navHistory, navProfile;

    // ── Bottom Navigation Icons & Labels ──────────────────────────────────────
    private ImageView ivNavHome, ivNavNodes, ivNavBookings, ivNavHistory, ivNavProfile;
    private TextView tvNavHome, tvNavNodes, tvNavBookings, tvNavHistory, tvNavProfile;

    /** Initializes operator dashboard and fetches live metrics from C# Web API. */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Bind views, set operator welcome greeting, wire bottom nav, and kick off all live data fetches
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_operator_main);

        sessionManager = new SessionManager(this);

        TextView tvWelcome = findViewById(R.id.tv_welcome);
        tvStationCount      = findViewById(R.id.tv_station_count);
        tvActiveBookings     = findViewById(R.id.tv_active_bookings);
        tvApprovedFuture     = findViewById(R.id.tv_approved_future);
        tvCompletedJobs      = findViewById(R.id.tv_completed_jobs);
        layoutStations       = findViewById(R.id.layout_stations);
        layoutTodayBookings = findViewById(R.id.layout_today_bookings);
        progressBar          = findViewById(R.id.progress_bar);

        if (tvWelcome != null) {
            tvWelcome.setText(getString(R.string.operator_welcome, sessionManager.getFullName()));
        }

        // Bind and setup persistent bottom navigation
        bindBottomNavigation();
        setupBottomNavigation();

        // Load live stats, station status, and today's bookings
        loadDashboardStats();
        loadStations();
        loadTodayBookings();

        // QR Scanner shortcut
        MaterialButton btnScanQr = findViewById(R.id.btn_scan_qr);
        if (btnScanQr != null) {
            btnScanQr.setOnClickListener(v -> startActivity(new Intent(this, QrScannerActivity.class)));
        }

        // Station inspection
        MaterialButton btnStations = findViewById(R.id.btn_stations);
        if (btnStations != null) {
            btnStations.setOnClickListener(v -> startActivity(new Intent(this, OperatorStationsActivity.class)));
        }

        // Settings (Theme & Logout)
        View btnSettings = findViewById(R.id.btn_settings);
        if (btnSettings != null) {
            btnSettings.setOnClickListener(v -> startActivity(new Intent(this, SettingsActivity.class)));
        }
    }
}