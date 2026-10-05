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
import androidx.core.content.res.ResourcesCompat;
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
    private HorizontalScrollView stationsScroll;
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
        stationsScroll       = findViewById(R.id.stations_scroll);

        // Horizontal strip arrows like prosumer home
        View stationsPrev = findViewById(R.id.btn_stations_prev);
        if (stationsPrev != null && stationsScroll != null) {
            stationsPrev.setOnClickListener(v -> stationsScroll.smoothScrollBy(-dpToPx(320), 0));
        }
        View stationsNext = findViewById(R.id.btn_stations_next);
        if (stationsNext != null && stationsScroll != null) {
            stationsNext.setOnClickListener(v -> stationsScroll.smoothScrollBy(dpToPx(320), 0));
        }

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

        // Fleet analytics (same charts as prosumer analytics, fleet-wide)
        MaterialButton btnAnalytics = findViewById(R.id.btn_analytics);
        if (btnAnalytics != null) {
            btnAnalytics.setOnClickListener(v -> startActivity(new Intent(this, OperatorAnalyticsActivity.class)));
        }

        // Settings (Theme & Logout)
        View btnSettings = findViewById(R.id.btn_settings);
        if (btnSettings != null) {
            btnSettings.setOnClickListener(v -> startActivity(new Intent(this, SettingsActivity.class)));
        }
    }

    // ── Bind Bottom Navigation & Section Containers ──────────────────────────
    private void bindBottomNavigation() {
        // Resolve section containers, nav layout items, icons and labels from layout XML
        // Section containers
        viewHome     = findViewById(R.id.view_operator_home);
        viewNodes    = findViewById(R.id.view_operator_nodes);
        viewBookings = findViewById(R.id.view_operator_bookings);
        viewHistory  = findViewById(R.id.view_operator_history);
        viewProfile  = findViewById(R.id.view_operator_profile);

        // Nav Item Layouts
        navHome     = findViewById(R.id.nav_operator_home);
        navNodes    = findViewById(R.id.nav_operator_nodes);
        navBookings = findViewById(R.id.nav_operator_bookings);
        navHistory  = findViewById(R.id.nav_operator_history);
        navProfile  = findViewById(R.id.nav_operator_profile);

        // Nav Icons
        ivNavHome     = findViewById(R.id.iv_nav_home);
        ivNavNodes    = findViewById(R.id.iv_nav_nodes);
        ivNavBookings = findViewById(R.id.iv_nav_bookings);
        ivNavHistory  = findViewById(R.id.iv_nav_history);
        ivNavProfile  = findViewById(R.id.iv_nav_profile);

        // Nav Labels removed in prosumer-style pill (icons only); fields stay null
        tvNavHome     = null;
        tvNavNodes    = null;
        tvNavBookings = null;
        tvNavHistory  = null;
        tvNavProfile  = null;
    }

    // ── Setup Bottom Navigation Click Handlers ──────────────────────────────
    private void setupBottomNavigation() {
        // Attach click listeners on all 5 bottom nav items and default-select Home tab
        if (navHome != null)     navHome.setOnClickListener(v -> selectSection(0));
        if (navNodes != null)    navNodes.setOnClickListener(v -> selectSection(1));
        if (navBookings != null) navBookings.setOnClickListener(v -> selectSection(2));
        if (navHistory != null)  navHistory.setOnClickListener(v -> selectSection(3));
        if (navProfile != null)  navProfile.setOnClickListener(v -> selectSection(4));

        // Default section is Home (index 0)
        selectSection(0);

        // Separate scan FAB like prosumer: pop animation then open the QR scanner
        View fab = findViewById(R.id.nav_scan_fab);
        if (fab != null) {
            fab.setOnClickListener(v -> {
                v.animate().scaleX(0.9f).scaleY(0.9f).setDuration(120).withEndAction(() ->
                        v.animate().scaleX(1f).scaleY(1f).setDuration(220).start()).start();
                v.postDelayed(() ->
                        startActivity(new Intent(this, QrScannerActivity.class)), 150);
            });
        }
    }

    // ── Switch Section View & Active Navigation State ───────────────────────
    private void selectSection(int index) {
        // Show the selected section container, hide all others, update active nav visual state
        // Toggle visibility of section containers
        if (viewHome != null)     viewHome.setVisibility(index == 0 ? View.VISIBLE : View.GONE);
        if (viewNodes != null)    viewNodes.setVisibility(index == 1 ? View.VISIBLE : View.GONE);
        if (viewBookings != null) viewBookings.setVisibility(index == 2 ? View.VISIBLE : View.GONE);
        if (viewHistory != null)  viewHistory.setVisibility(index == 3 ? View.VISIBLE : View.GONE);
        if (viewProfile != null)  viewProfile.setVisibility(index == 4 ? View.VISIBLE : View.GONE);

        // Update active/inactive visual states for all bottom nav items
        updateNavItemState(navHome,     ivNavHome,     tvNavHome,     index == 0);
        updateNavItemState(navNodes,    ivNavNodes,    tvNavNodes,    index == 1);
        updateNavItemState(navBookings, ivNavBookings, tvNavBookings, index == 2);
        updateNavItemState(navHistory,  ivNavHistory,  tvNavHistory,  index == 3);
        updateNavItemState(navProfile,  ivNavProfile,  tvNavProfile,  index == 4);

        // Map page runs full-screen: hide bottom nav and reclaim its padding there
        View bottomNav = findViewById(R.id.operator_bottom_nav);
        if (bottomNav != null) bottomNav.setVisibility(index == 1 ? View.GONE : View.VISIBLE);
        if (viewNodes != null) {
            int pb = (index == 1) ? 0 : dpToPx(100);
            viewNodes.setPadding(viewNodes.getPaddingLeft(), viewNodes.getPaddingTop(),
                    viewNodes.getPaddingRight(), pb);
        }

        if (index == 1) {
            loadAllNodesMapOverlay();
        } else if (index == 2) {
            setupBookingsSection();
        } else if (index == 3) {
            setupHistorySection();
        } else if (index == 4) {
            setupProfileSection();
        }
    }

    private boolean isProfileInitialized = false;

    /** Wire and fetch authoritative operator identity package from Web API */
    private void setupProfileSection() {
        // Wire logout dialog and call API to fetch and render live operator profile data
        if (!isProfileInitialized) {
            // Logout execution
            View btnLogout = findViewById(R.id.btn_operator_logout);
            if (btnLogout != null) {
                btnLogout.setOnClickListener(v -> {
                    new AlertDialog.Builder(this)
                            .setTitle("Sign Out")
                            .setMessage("Are you sure you want to sign out of the operator console?")
                            .setPositiveButton("Sign Out", (dialog, which) -> {
                                sessionManager.logout();
                                OnboardingPrefs.setCompleted(OperatorMainActivity.this, false);
                                Intent intent = new Intent(OperatorMainActivity.this, OnboardingActivity.class);
                                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                                startActivity(intent);
                                finish();
                            })
                            .setNegativeButton("Cancel", null)
                            .show();
                });
            }
            // Copy email to clipboard like prosumer profile Copy label
            View btnCopy = findViewById(R.id.tv_operator_copy_email);
            if (btnCopy != null) {
                btnCopy.setOnClickListener(v -> {
                    TextView tvEmail = findViewById(R.id.tv_operator_username);
                    String email = tvEmail != null ? tvEmail.getText().toString() : "";
                    android.content.ClipboardManager cm =
                            (android.content.ClipboardManager) getSystemService(android.content.Context.CLIPBOARD_SERVICE);
                    if (cm != null) {
                        cm.setPrimaryClip(android.content.ClipData.newPlainText("email", email));
                        Toast.makeText(this, "Email copied", Toast.LENGTH_SHORT).show();
                    }
                });
            }
            isProfileInitialized = true;
        }

        fetchOperatorProfile();
    }

    private void fetchOperatorProfile() {
        // GET /api/users/{nic} and populate profile card fields with authoritative server data
        final View pb = findViewById(R.id.profile_progress_bar);
        if (pb != null) pb.setVisibility(View.VISIBLE);

        String nic = sessionManager.getNic();
        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this, "users/" + nic).get().build();
                try (Response response = ApiClient.getClient().newCall(request).execute()) {
                    if (response.body() != null) {
                        String body = response.body().string();
                        JSONObject json = new JSONObject(body);

                        runOnUiThread(() -> {
                            if (pb != null) pb.setVisibility(View.GONE);
                            renderProfileData(json);
                        });
                    }
                }
            } catch (Exception e) {
                runOnUiThread(() -> {
                    if (pb != null) pb.setVisibility(View.GONE);
                    Toast.makeText(this, "Profile Load Error", Toast.LENGTH_SHORT).show();
                });
            }
        }).start();
    }

    private void renderProfileData(JSONObject user) {
        // Populate name, avatar initials, role, NIC, email, phone and address TextViews from JSON
        TextView tvName     = findViewById(R.id.tv_operator_name);
        TextView tvAvatar   = findViewById(R.id.tv_operator_avatar);
        TextView tvRole     = findViewById(R.id.tv_operator_role);
        TextView tvNic      = findViewById(R.id.tv_operator_nic);
        TextView tvUsername = findViewById(R.id.tv_operator_username);
        TextView tvEmailInline = findViewById(R.id.tv_operator_email_inline);
        TextView tvPhone    = findViewById(R.id.tv_operator_phone);
        TextView tvAddress  = findViewById(R.id.tv_operator_address);

        if (user == null) return;

        String fullName = user.optString("fullName", "Grid Operator");
        if (tvName != null) tvName.setText(fullName);

        // Avatar Initials
        if (tvAvatar != null && !fullName.isEmpty()) {
            String[] parts = fullName.split(" ");
            String initials = "";
            if (parts.length > 0) initials += parts[0].charAt(0);
            if (parts.length > 1) initials += parts[parts.length - 1].charAt(0);
            tvAvatar.setText(initials.toUpperCase());
        }

        if (tvRole != null)     tvRole.setText(user.optString("role", "Grid Operator"));
        if (tvNic != null)      tvNic.setText("NIC Identifier: " + user.optString("nic", "—"));
        if (tvUsername != null) tvUsername.setText(user.optString("email", "—"));
        if (tvEmailInline != null) tvEmailInline.setText(user.optString("email", "—"));
        if (tvPhone != null)    tvPhone.setText(user.optString("phoneNumber", "N/A"));
        if (tvAddress != null)  tvAddress.setText(user.optString("address", "Not Specified"));
    }

    private final List<JSONObject> allHistoryList = new ArrayList<>();
    private final List<JSONObject> filteredHistoryList = new ArrayList<>();
    private HistoryAdapter operatorHistoryAdapter;
    private boolean isHistoryInitialized = false;

    /** Wire and fetch transaction history logs matching completion criteria */
    private void setupHistorySection() {
        // Initialise RecyclerView, search TextWatcher, and fetch transaction history from API
        final RecyclerView rv = findViewById(R.id.recycler_operator_history);
        final EditText etSearch = findViewById(R.id.et_history_search);

        if (rv == null) return;

        if (!isHistoryInitialized) {
            rv.setLayoutManager(new LinearLayoutManager(this));
            operatorHistoryAdapter = new HistoryAdapter(filteredHistoryList);
            rv.setAdapter(operatorHistoryAdapter);

            if (etSearch != null) {
                etSearch.addTextChangedListener(new TextWatcher() {
                    @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                    @Override public void onTextChanged(CharSequence s, int start, int before, int count) { performHistoryFilter(); }
                    @Override public void afterTextChanged(Editable s) {}
                });
            }
            isHistoryInitialized = true;
        }

        fetchHistoryFromApi();
    }

    private void fetchHistoryFromApi() {
        // GET /api/reservations, filter Completed/Approved entries, and populate history list
        final View pb = findViewById(R.id.history_progress_bar);
        if (pb != null) pb.setVisibility(View.VISIBLE);

        new Thread(() -> {
            try {
                // Fetching all reservations and filtering for 'Completed' and 'Approved' status locally
                Request request = ApiClient.buildAuthRequest(this, "reservations").get().build();
                try (Response response = ApiClient.getClient().newCall(request).execute()) {
                    if (response.body() != null) {
                        String body = response.body().string();
                        JSONArray array = new JSONArray(body);
                        synchronized (allHistoryList) {
                            allHistoryList.clear();
                            for (int i = 0; i < array.length(); i++) {
                                JSONObject obj = array.getJSONObject(i);
                                String status = obj.optString("status");
                                if ("Completed".equalsIgnoreCase(status) || "Approved".equalsIgnoreCase(status)) {
                                    allHistoryList.add(obj);
                                }
                            }
                        }
                        runOnUiThread(() -> {
                            if (pb != null) pb.setVisibility(View.GONE);
                            performHistoryFilter();
                        });
                        return;
                    }
                }
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(this, "History Load Error: " + e.getMessage(), Toast.LENGTH_SHORT).show());
            }
            runOnUiThread(() -> { if (pb != null) pb.setVisibility(View.GONE); });
        }).start();
    }

    private void performHistoryFilter() {
        // Filter history list by search query across NIC, name, code, node and date fields
        final EditText etSearch = findViewById(R.id.et_history_search);
        final TextView tvEmpty = findViewById(R.id.tv_history_empty);

        String query = etSearch != null ? etSearch.getText().toString().trim().toLowerCase() : "";

        synchronized (allHistoryList) {
            filteredHistoryList.clear();
            for (JSONObject h : allHistoryList) {
                String pNic = h.optString("prosumerNic", "").toLowerCase();
                String pName = h.optString("prosumerName", "").toLowerCase();
                String bId = h.optString("id", "").toLowerCase();
                String bCode = h.optString("reservationCode", "").toLowerCase();
                String node = h.optString("stationName", "").toLowerCase();
                String date = h.optString("scheduledDateTime", "").toLowerCase();
                
                // Authoritative transaction ID usually derived from Booking ID in this architecture if not explicit
                String txId = "TXN-" + bId.toUpperCase().substring(0, Math.min(bId.length(), 8));

                boolean matches = query.isEmpty() || pNic.contains(query) || txId.toLowerCase().contains(query) 
                                || bId.contains(query) || bCode.contains(query) || node.contains(query) || date.contains(query) || pName.contains(query);

                if (matches) {
                    filteredHistoryList.add(h);
                }
            }
        }

        if (operatorHistoryAdapter != null) {
            operatorHistoryAdapter.notifyDataSetChanged();
        }
        if (tvEmpty != null) {
            tvEmpty.setVisibility(filteredHistoryList.isEmpty() ? View.VISIBLE : View.GONE);
        }
    }

    /** Historical logs Adapter architecture mapping authoritative transaction records */
    private class HistoryAdapter extends RecyclerView.Adapter<HistoryAdapter.VH> {
        private final List<JSONObject> items;
        HistoryAdapter(List<JSONObject> items) { this.items = items; }

        @Override public VH onCreateViewHolder(ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_history, parent, false);
            return new VH(v);
        }

        @Override public void onBindViewHolder(VH holder, int position) {
            try {
                JSONObject h = items.get(position);
                final String bId = h.optString("id");
                
                String txId = "TXN-" + bId.toUpperCase().substring(0, Math.min(bId.length(), 8));
                holder.tvTxnId.setText(txId);
                
                String bCode = h.optString("reservationCode", "RES-" + bId.substring(0, 6));
                holder.tvBookingId.setText("Booking: " + bCode);
                
                holder.tvProsumer.setText(h.optString("prosumerName", "Prosumer Agent"));
                holder.tvNic.setText("NIC: " + h.optString("prosumerNic", "N/A"));
                
                holder.tvNode.setText("Node: " + h.optString("stationName", "Solar Hub"));
                
                // Time column value only (label "Time" is static in layout, like reference)
                String scheduledRaw = h.optString("scheduledDateTime", "").replace("T", " ");
                String scheduled = scheduledRaw.length() >= 16 ? scheduledRaw.substring(0, 16) : scheduledRaw;
                holder.tvTimestamp.setText(scheduled.isEmpty() ? "—" : scheduled);
                
                holder.tvEnergy.setText(h.optDouble("energyAmountKWh", 0.0) + " kWh");

                // Find-Classes style chip: solid deep-green button like "Book Now".
                // Palette: #063127 completed, #3B796A approved.
                String status = h.optString("status", "Completed");
                holder.tvStatus.setText(status.toUpperCase());
                holder.tvStatus.setTextColor(0xFFFFFFFF);
                if ("Approved".equalsIgnoreCase(status)) {
                    holder.tvStatus.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFF3B796A));
                } else {
                    holder.tvStatus.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFF063127));
                }

                // Navigate to historical transaction audit details on tap
                holder.itemView.setOnClickListener(v -> {
                    Intent intent = new Intent(OperatorMainActivity.this, OperatorTransactionDetailActivity.class);
                    intent.putExtra("booking_id", bId);
                    startActivity(intent);
                });

            } catch (Exception ignored) {}
        }

        @Override public int getItemCount() { return items.size(); }

        class VH extends RecyclerView.ViewHolder {
            TextView tvTxnId, tvBookingId, tvProsumer, tvNic, tvNode, tvTimestamp, tvEnergy, tvStatus;
            VH(View v) { super(v);
                tvTxnId = v.findViewById(R.id.tv_history_txn_id);
                tvBookingId = v.findViewById(R.id.tv_history_booking_id);
                tvProsumer = v.findViewById(R.id.tv_history_prosumer);
                tvNic = v.findViewById(R.id.tv_history_nic);
                tvNode = v.findViewById(R.id.tv_history_node);
                tvTimestamp = v.findViewById(R.id.tv_history_timestamp);
                tvEnergy = v.findViewById(R.id.tv_history_energy);
                tvStatus = v.findViewById(R.id.tv_history_status);
            }
        }
    }

    private final List<JSONObject> allBookingsList = new ArrayList<>();
    private final List<JSONObject> filteredBookingsList = new ArrayList<>();
    private BookingsAdapter operatorBookingsAdapter;
    private boolean isBookingsInitialized = false;

    /** Wire and fetch full database collection logs matching operational bookings */
    private void setupBookingsSection() {
        // Initialise RecyclerView, status drop-down, search watcher, header scan shortcut
        final RecyclerView rv = findViewById(R.id.recycler_operator_bookings);
        final EditText etSearch = findViewById(R.id.et_booking_search);
        final Spinner spinnerStatus = findViewById(R.id.spinner_status_filter);

        if (rv == null) return;

        if (!isBookingsInitialized) {
            rv.setLayoutManager(new LinearLayoutManager(this));
            operatorBookingsAdapter = new BookingsAdapter(filteredBookingsList);
            rv.setAdapter(operatorBookingsAdapter);

            // Status filter state lives in hidden spinner (All, Pending, Approved, Cancelled, Completed)
            List<String> options = Arrays.asList("All Statuses", "Pending", "Approved", "Cancelled", "Completed");
            ArrayAdapter<String> spinnerAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, options);
            spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
            if (spinnerStatus != null) {
                spinnerStatus.setAdapter(spinnerAdapter);
                spinnerStatus.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
                    @Override public void onItemSelected(AdapterView<?> p, View v, int pos, long id) { performBookingsFilter(); }
                    @Override public void onNothingSelected(AdapterView<?> p) {}
                });
            }

            // Header Scan QR shortcut
            View btnScan = findViewById(R.id.btn_bookings_scan);
            if (btnScan != null) {
                btnScan.setOnClickListener(v -> startActivity(new Intent(this, QrScannerActivity.class)));
            }

            // 3-line filter icon opens the status drop-down list
            View btnFilter = findViewById(R.id.btn_booking_filter);
            if (btnFilter != null && spinnerStatus != null) {
                btnFilter.setOnClickListener(v -> spinnerStatus.performClick());
            }

            if (etSearch != null) {
                etSearch.addTextChangedListener(new TextWatcher() {
                    @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                    @Override public void onTextChanged(CharSequence s, int start, int before, int count) { performBookingsFilter(); }
                    @Override public void afterTextChanged(Editable s) {}
                });
            }
            isBookingsInitialized = true;
        }

        fetchBookingsFromApi();
    }

    private void fetchBookingsFromApi() {
        // GET /api/reservations and store full collection in allBookingsList for filtering
        final View pb = findViewById(R.id.bookings_progress_bar);
        final TextView tvEmpty = findViewById(R.id.tv_bookings_empty);
        if (pb != null) pb.setVisibility(View.VISIBLE);

        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this, "reservations").get().build();
                try (Response response = ApiClient.getClient().newCall(request).execute()) {
                    if (response.body() != null) {
                        String body = response.body().string();
                        JSONArray array = new JSONArray(body);
                        synchronized (allBookingsList) {
                            allBookingsList.clear();
                            for (int i = 0; i < array.length(); i++) {
                                allBookingsList.add(array.getJSONObject(i));
                            }
                        }
                        runOnUiThread(() -> {
                            if (pb != null) pb.setVisibility(View.GONE);
                            performBookingsFilter();
                        });
                        return;
                    }
                }
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(this, "Failed to load bookings: " + e.getMessage(), Toast.LENGTH_SHORT).show());
            }
            runOnUiThread(() -> { if (pb != null) pb.setVisibility(View.GONE); });
        }).start();
    }

    private void performBookingsFilter() {
        // Apply combined text search and status spinner filter over all bookings records
        final EditText etSearch = findViewById(R.id.et_booking_search);
        final Spinner spinnerStatus = findViewById(R.id.spinner_status_filter);
        final TextView tvEmpty = findViewById(R.id.tv_bookings_empty);

        String query = etSearch != null ? etSearch.getText().toString().trim().toLowerCase() : "";
        String statusFilter = spinnerStatus != null ? spinnerStatus.getSelectedItem().toString() : "All Statuses";

        synchronized (allBookingsList) {
            filteredBookingsList.clear();
            for (JSONObject b : allBookingsList) {
                String prosumerName = b.optString("prosumerName", "").toLowerCase();
                String prosumerNic = b.optString("prosumerNic", "").toLowerCase();
                String bId = b.optString("id", "").toLowerCase();
                String bCode = b.optString("reservationCode", "").toLowerCase();
                String bStatus = b.optString("status", "");

                boolean matchesQuery = query.isEmpty() || prosumerName.contains(query) || prosumerNic.contains(query) || bId.contains(query) || bCode.contains(query);
                boolean matchesStatus = statusFilter.equals("All Statuses") || bStatus.equalsIgnoreCase(statusFilter);

                if (matchesQuery && matchesStatus) {
                    filteredBookingsList.add(b);
                }
            }
        }

        if (operatorBookingsAdapter != null) {
            operatorBookingsAdapter.notifyDataSetChanged();
        }
        if (tvEmpty != null) {
            tvEmpty.setVisibility(filteredBookingsList.isEmpty() ? View.VISIBLE : View.GONE);
        }
        final TextView tvCount = findViewById(R.id.tv_bookings_count);
        if (tvCount != null) {
            tvCount.setText(filteredBookingsList.size() + " reservations");
        }
    }

    /** View Holder / Adapter architecture for dynamic operator reservations listing */
    private class BookingsAdapter extends RecyclerView.Adapter<BookingsAdapter.VH> {
        private final List<JSONObject> items;
        BookingsAdapter(List<JSONObject> items) { this.items = items; }

        @Override public VH onCreateViewHolder(ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_booking, parent, false);
            return new VH(v);
        }

        @Override public void onBindViewHolder(VH holder, int position) {
            try {
                JSONObject b = items.get(position);
                final String bId = b.optString("id");
                
                String resCode = b.optString("reservationCode", "RES-" + bId.substring(0, Math.min(bId.length(), 6)));
                holder.tvCode.setText(resCode);

                // From = prosumer, To = station node
                String prosumer = b.optString("prosumerName", "Prosumer Agent");
                String nic = b.optString("prosumerNic", "N/A");
                String node = b.optString("stationName", "Solar Hub");
                if (holder.tvFrom != null) holder.tvFrom.setText(prosumer);
                holder.tvStation.setText(nic);
                if (holder.tvTo != null) holder.tvTo.setText(node);

                String scheduled = b.optString("scheduledDateTime", "");
                String time = scheduled.length() >= 16 ? scheduled.substring(11, 16) : "N/A";
                String date = scheduled.length() >= 10 ? scheduled.substring(0, 10) : scheduled;
                holder.tvDate.setText(date + " " + time);

                holder.tvEnergy.setText(b.optDouble("energyAmountKWh", 0.0) + " kWh");
                if (holder.tvCost != null) {
                    holder.tvCost.setVisibility(View.GONE);
                }

                // Status chip + 3-step tracker: Requested > Approved > Completed
                String status = b.optString("status", "Pending");
                holder.tvStatus.setText(status);
                int step = 0; // 0 pending, 1 approved, 2 completed
                if ("Completed".equalsIgnoreCase(status)) step = 2;
                else if ("Approved".equalsIgnoreCase(status)) step = 1;
                else if ("Cancelled".equalsIgnoreCase(status)) step = -1;

                if (step == 2) {
                    holder.tvStatus.setTextColor(0xFFFFFFFF);
                    holder.tvStatus.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFF063127));
                } else if (step == 1) {
                    holder.tvStatus.setTextColor(0xFFFFFFFF);
                    holder.tvStatus.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFF3B796A));
                } else if (step == -1) {
                    holder.tvStatus.setTextColor(0xFF063127);
                    holder.tvStatus.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFF8FB3A9));
                } else {
                    holder.tvStatus.setTextColor(0xFF063127);
                    holder.tvStatus.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFFBFD5D0));
                }

                // Dots: done / current / todo
                if (holder.dot1 != null && holder.dot2 != null && holder.dot3 != null
                        && holder.line1 != null && holder.line2 != null) {
                    if (step == -1) {
                        holder.dot1.setBackgroundResource(R.drawable.bg_track_dot_todo);
                        holder.dot2.setBackgroundResource(R.drawable.bg_track_dot_todo);
                        holder.dot3.setBackgroundResource(R.drawable.bg_track_dot_todo);
                        holder.line1.setBackgroundColor(0xFFBFD5D0);
                        holder.line2.setBackgroundColor(0xFFBFD5D0);
                    } else {
                        holder.dot1.setBackgroundResource(R.drawable.bg_track_dot_done);
                        holder.dot2.setBackgroundResource(step >= 1 ? R.drawable.bg_track_dot_done : R.drawable.bg_track_dot_todo);
                        if (step == 0) holder.dot2.setBackgroundResource(R.drawable.bg_track_dot_current);
                        holder.dot3.setBackgroundResource(step >= 2 ? R.drawable.bg_track_dot_done : R.drawable.bg_track_dot_todo);
                        holder.line1.setBackgroundColor(step >= 1 ? 0xFF063127 : 0xFFBFD5D0);
                        holder.line2.setBackgroundColor(step >= 2 ? 0xFF063127 : 0xFFBFD5D0);
                    }
                }

                // Redirect operator to Booking Detail insight screen when specific cell is tapped
                holder.itemView.setOnClickListener(v -> {
                    Intent intent = new Intent(OperatorMainActivity.this, OperatorBookingDetailActivity.class);
                    intent.putExtra("booking_id", bId);
                    startActivity(intent);
                });

            } catch (Exception ignored) {}
        }

        @Override public int getItemCount() { return items.size(); }

        class VH extends RecyclerView.ViewHolder {
            TextView tvCode, tvStation, tvEnergy, tvStatus, tvDate, tvCost, tvFrom, tvTo;
            View dot1, dot2, dot3, line1, line2;
            VH(View v) { super(v);
                tvCode = v.findViewById(R.id.tv_booking_code);
                tvStation = v.findViewById(R.id.tv_booking_station);
                tvEnergy = v.findViewById(R.id.tv_booking_energy);
                tvStatus = v.findViewById(R.id.tv_booking_status);
                tvDate = v.findViewById(R.id.tv_booking_date);
                tvCost = v.findViewById(R.id.tv_booking_cost);
                tvFrom = v.findViewById(R.id.tv_booking_from);
                tvTo = v.findViewById(R.id.tv_booking_to);
                dot1 = v.findViewById(R.id.view_dot_1);
                dot2 = v.findViewById(R.id.view_dot_2);
                dot3 = v.findViewById(R.id.view_dot_3);
                line1 = v.findViewById(R.id.view_line_1);
                line2 = v.findViewById(R.id.view_line_2);
            }
        }
    }

    private final List<JSONObject> allNodesStations = new ArrayList<>();
    private boolean isNodesInitialized = false;
    private boolean isNodesCameraInit = false;

    /** Fleet map: search, live counts, legend and hub quick-strip over OpenStreetMap markers */
    private void loadAllNodesMapOverlay() {
        // Fetch all stations once per visit, plot markers, and keep search/strip/legend in sync
        final MapView mapView = findViewById(R.id.operator_all_nodes_map);
        final View mapProgress = findViewById(R.id.map_progress_bar);
        if (mapView == null) return;

        // Configure maps rendering profiles state variables
        Configuration.getInstance().setUserAgentValue(getPackageName());
        mapView.setTileSource(TileSourceFactory.MAPNIK);
        mapView.setMultiTouchControls(true);

        if (!isNodesInitialized) {
            View btnNodesBack = findViewById(R.id.btn_nodes_back);
            if (btnNodesBack != null) {
                btnNodesBack.setOnClickListener(v -> selectSection(0));
            }
            final EditText etNodesSearch = findViewById(R.id.et_nodes_search);
            if (etNodesSearch != null) {
                etNodesSearch.addTextChangedListener(new TextWatcher() {
                    @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                    @Override public void onTextChanged(CharSequence s, int start, int before, int count) { applyNodesFilter(); }
                    @Override public void afterTextChanged(Editable s) {}
                });
            }
            View btnRecenter = findViewById(R.id.btn_nodes_recenter);
            if (btnRecenter != null) {
                btnRecenter.setOnClickListener(v -> {
                    mapView.getController().setZoom(7.5);
                    mapView.getController().setCenter(new GeoPoint(7.8731, 80.7718));
                    mapView.invalidate();
                });
            }
            isNodesInitialized = true;
        }

        if (!isNodesCameraInit) {
            mapView.getController().setZoom(7.5);
            mapView.getController().setCenter(new GeoPoint(7.8731, 80.7718));
            isNodesCameraInit = true;
        }

        if (mapProgress != null) mapProgress.setVisibility(View.VISIBLE);

        new Thread(() -> {
            try {
                Request req = ApiClient.buildAuthRequest(this, "stations").get().build();
                try (Response res = ApiClient.getClient().newCall(req).execute()) {
                    if (res.body() != null) {
                        String body = res.body().string();
                        final JSONArray array = new JSONArray(body);
                        synchronized (allNodesStations) {
                            allNodesStations.clear();
                            for (int i = 0; i < array.length(); i++) {
                                allNodesStations.add(array.getJSONObject(i));
                            }
                        }
                        runOnUiThread(() -> {
                            if (mapProgress != null) mapProgress.setVisibility(View.GONE);
                            updateNodesLegend();
                            applyNodesFilter();
                        });
                    }
                }
            } catch (Exception e) {
                runOnUiThread(() -> {
                    if (mapProgress != null) mapProgress.setVisibility(View.GONE);
                    Toast.makeText(OperatorMainActivity.this, "Map load failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
            }
        }).start();
    }

    /** Re-plot markers and hub strip for the current nodes search query. */
    private void applyNodesFilter() {
        final MapView mapView = findViewById(R.id.operator_all_nodes_map);
        final EditText etSearch = findViewById(R.id.et_nodes_search);
        final TextView tvSub = findViewById(R.id.tv_nodes_sub);
        if (mapView == null) return;

        String query = etSearch != null ? etSearch.getText().toString().trim().toLowerCase() : "";
        List<JSONObject> filtered = new ArrayList<>();
        int totalFree = 0;
        synchronized (allNodesStations) {
            for (JSONObject s : allNodesStations) {
                totalFree += s.optInt("availableBatterySlots", 0);
                String name = s.optString("name", "").toLowerCase();
                String code = s.optString("stationCode", "").toLowerCase();
                if (query.isEmpty() || name.contains(query) || code.contains(query)) {
                    filtered.add(s);
                }
            }
            if (tvSub != null) {
                if (query.isEmpty()) {
                    tvSub.setText(allNodesStations.size() + " hubs · " + totalFree + " slots free");
                } else {
                    tvSub.setText(filtered.size() + " of " + allNodesStations.size() + " hubs match");
                }
            }
        }

        mapView.getOverlays().clear();
        for (JSONObject station : filtered) {
            try {
                final String sId = station.optString("id");
                double lat = station.getDouble("latitude");
                double lng = station.getDouble("longitude");
                String name = station.getString("name");
                String code = station.optString("stationCode");
                int freeSlots = station.optInt("availableBatterySlots");
                String status = station.optString("status");

                Marker marker = new Marker(mapView);
                marker.setPosition(new GeoPoint(lat, lng));
                marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
                marker.setTitle(name + " [" + code + "]");
                marker.setSnippet("Status: " + status + " | " + freeSlots + " slots available");
                android.graphics.drawable.Drawable hubIcon =
                        ResourcesCompat.getDrawable(getResources(), R.drawable.ic_map_hub, null);
                if (hubIcon != null) marker.setIcon(hubIcon);

                // Clicking marker redirects operator straight to that exact node's insight metrics
                marker.setOnMarkerClickListener((m, mv) -> {
                    Intent intent = new Intent(OperatorMainActivity.this, OperatorNodeDetailActivity.class);
                    intent.putExtra("station_id", sId);
                    startActivity(intent);
                    return true;
                });

                mapView.getOverlays().add(marker);
            } catch (Exception ignored) {}
        }
        mapView.invalidate();

        renderNodesStrip(filtered);
    }

    /** Hub quick-strip chips: tap glides the camera to that node. */
    private void renderNodesStrip(List<JSONObject> stations) {
        LinearLayout strip = findViewById(R.id.layout_nodes_strip);
        final MapView mapView = findViewById(R.id.operator_all_nodes_map);
        if (strip == null) return;
        strip.removeAllViews();

        if (stations.isEmpty()) {
            TextView tvNone = new TextView(this);
            tvNone.setText("No hubs match this search.");
            tvNone.setTextSize(12);
            tvNone.setTextColor(0xFFFFFFFF);
            tvNone.setPadding(dpToPx(4), dpToPx(8), dpToPx(4), dpToPx(8));
            strip.addView(tvNone);
            return;
        }

        int show = Math.min(stations.size(), 20);
        for (int i = 0; i < show; i++) {
            JSONObject s = stations.get(i);
            String name = s.optString("name", "Hub");
            String code = s.optString("stationCode", "");
            int free = s.optInt("availableBatterySlots", 0);
            int total = s.optInt("totalBatterySlots", 0);

            TextView chip = new TextView(this);
            chip.setText(name + " · " + free + "/" + total);
            chip.setTextSize(12);
            chip.setSingleLine(true);
            chip.setEllipsize(android.text.TextUtils.TruncateAt.END);
            chip.setMaxWidth(dpToPx(210));
            chip.setTextColor(0xFF063127);
            chip.setBackgroundResource(R.drawable.bg_node_chip);
            chip.setPadding(dpToPx(14), dpToPx(9), dpToPx(14), dpToPx(9));
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            params.rightMargin = dpToPx(8);
            chip.setLayoutParams(params);
            chip.setClickable(true);
            chip.setFocusable(true);

            try {
                final double lat = s.getDouble("latitude");
                final double lng = s.getDouble("longitude");
                chip.setOnClickListener(v -> {
                    if (mapView != null) {
                        mapView.getController().setZoom(14.0);
                        mapView.getController().setCenter(new GeoPoint(lat, lng));
                        mapView.invalidate();
                    }
                });
            } catch (Exception ignored) {}

            strip.addView(chip);
        }
    }

    /** Legend counts: Active vs Full vs Offline hubs. */
    private void updateNodesLegend() {
        int active = 0, full = 0, offline = 0;
        synchronized (allNodesStations) {
            for (JSONObject s : allNodesStations) {
                boolean isActive = "Active".equalsIgnoreCase(s.optString("status", ""));
                int free = s.optInt("availableBatterySlots", 0);
                if (!isActive) offline++;
                else if (free <= 0) full++;
                else active++;
            }
        }
        TextView tvA = findViewById(R.id.tv_legend_active);
        TextView tvF = findViewById(R.id.tv_legend_low);
        TextView tvO = findViewById(R.id.tv_legend_offline);
        if (tvA != null) tvA.setText("Active " + active);
        if (tvF != null) tvF.setText("Full " + full);
        if (tvO != null) tvO.setText("Offline " + offline);
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    private void updateNavItemState(LinearLayout container, ImageView icon, TextView label, boolean isSelected) {
        // Prosumer-style floating pill: icons only, deep-green selected, soft unselected + tap pop
        if (container == null || icon == null) return;
        if (label != null) label.setVisibility(View.GONE);
        container.setBackground(null);
        int tint = isSelected ? 0xFF063127 : 0xFF65998B;
        icon.setImageTintList(android.content.res.ColorStateList.valueOf(tint));
        icon.animate().cancel();
        icon.setScaleX(1f);
        icon.setScaleY(1f);
        if (isSelected) {
            icon.animate().scaleX(1.15f).scaleY(1.15f).setDuration(180)
                    .withEndAction(() -> icon.animate().scaleX(1f).scaleY(1f)
                            .setDuration(300).start()).start();
        }
    }

    /** Fetches global dashboard stats from C# Web API. */
    private void loadDashboardStats() {
        // GET /api/reservations/dashboard-stats and update KPI counter TextViews on main thread
        new Thread(() -> {
            try {
                Request req = ApiClient.buildAuthRequest(this, "reservations/dashboard-stats").get().build();
                try (Response res = ApiClient.getClient().newCall(req).execute()) {
                    if (res.body() != null) {
                        String responseBody = res.body().string();
                        JSONObject json = new JSONObject(responseBody);
                        int totalStations = json.optInt("totalStationsCount", 0);
                        int activeBookings = json.optInt("activeReservationsCount", 0);
                        int approvedFuture = json.optInt("countOfApprovedFutureReservations", 0);
                        int completedJobs = json.optInt("completedReservationsCount", 0);

                        runOnUiThread(() -> {
                            if (tvStationCount != null)   tvStationCount.setText(getString(R.string.kpi_active_nodes, totalStations));
                            if (tvActiveBookings != null) tvActiveBookings.setText(getString(R.string.kpi_active_bookings, activeBookings));
                            if (tvApprovedFuture != null) tvApprovedFuture.setText(getString(R.string.kpi_approved_future, approvedFuture));
                            if (tvCompletedJobs != null)  tvCompletedJobs.setText(getString(R.string.kpi_completed_jobs, completedJobs));
                        });
                    }
                }
            } catch (Exception ignored) {}
        }).start();
    }

    /** Fetches station list and displays battery slot info for each hub. */
    private void loadStations() {
        // GET /api/stations and inflate station card rows with battery slot metrics and click handlers
        if (progressBar != null) progressBar.setVisibility(View.VISIBLE);
        new Thread(() -> {
            try {
                Request req = ApiClient.buildAuthRequest(this, "stations").get().build();
                try (Response res = ApiClient.getClient().newCall(req).execute()) {
                    if (res.body() != null) {
                        String responseBody = res.body().string();
                        JSONArray array = new JSONArray(responseBody);
                        runOnUiThread(() -> {
                            if (progressBar != null) progressBar.setVisibility(View.GONE);
                            if (layoutStations != null) {
                                layoutStations.removeAllViews();
                                LayoutInflater inflater = LayoutInflater.from(this);
                                int[] art = {
                                        R.drawable.house_solar_1, R.drawable.house_solar_2,
                                        R.drawable.house_solar_3, R.drawable.house_solar_4,
                                        R.drawable.house_solar_5 };
                                int show = Math.min(array.length(), 4);
                                for (int i = 0; i < show; i++) {
                                    try {
                                        JSONObject s = array.getJSONObject(i);
                                        View row = inflater.inflate(R.layout.item_station, layoutStations, false);
                                        // Fixed card width for the horizontal strip
                                        LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                                                dpToPx(300), LinearLayout.LayoutParams.WRAP_CONTENT);
                                        rowParams.rightMargin = dpToPx(12);
                                        row.setLayoutParams(rowParams);

                                        TextView tvName = row.findViewById(R.id.tv_station_name);
                                        TextView tvLoc = row.findViewById(R.id.tv_station_location);
                                        TextView tvSlots = row.findViewById(R.id.tv_station_slots);
                                        TextView tvStatus = row.findViewById(R.id.tv_station_status);
                                        TextView tvMeta = row.findViewById(R.id.tv_station_meta);
                                        android.widget.ImageView ivPhoto = row.findViewById(R.id.iv_station_photo);
                                        View btnAdjust = row.findViewById(R.id.btn_update_slots);

                                        if (tvName != null) tvName.setText(
                                                s.optString("name") + " [" + s.optString("stationCode") + "]");
                                        if (tvLoc != null) tvLoc.setText(s.optString("location", ""));
                                        if (tvSlots != null) tvSlots.setText("Battery: "
                                                + s.optInt("availableBatterySlots") + "/"
                                                + s.optInt("totalBatterySlots") + " free");
                                        if (tvStatus != null) tvStatus.setText(
                                                s.optString("status", "Active").toUpperCase(Locale.getDefault()));
                                        if (tvMeta != null) tvMeta.setText(
                                                s.optInt("activeReservationsCount", 0) + " bookings");
                                        if (ivPhoto != null) {
                                            try { ivPhoto.setImageResource(art[i % art.length]); }
                                            catch (Exception ignored) {}
                                        }
                                        // Home preview rows are view-only; hide adjust to keep console clean
                                        if (btnAdjust != null) btnAdjust.setVisibility(View.GONE);

                                        // Tap card row -> navigate to Node Details view
                                        final String currentId = s.optString("id");
                                        row.setClickable(true);
                                        row.setFocusable(true);
                                        row.setOnClickListener(v -> {
                                            Intent intent = new Intent(OperatorMainActivity.this, OperatorNodeDetailActivity.class);
                                            intent.putExtra("station_id", currentId);
                                            startActivity(intent);
                                        });

                                        layoutStations.addView(row);
                                    } catch (Exception ignored) {}
                                }
                                if (array.length() == 0) {
                                    TextView tvNone = new TextView(this);
                                    tvNone.setText("No stations reporting right now.");
                                    tvNone.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
                                    tvNone.setPadding(16, 16, 16, 16);
                                    layoutStations.addView(tvNone);
                                }
                            }
                        });
                    }
                }
            } catch (Exception e) {
                runOnUiThread(() -> { if (progressBar != null) progressBar.setVisibility(View.GONE); });
            }
        }).start();
    }

    /** Fetches all reservations and filters for today's scheduled bookings. */
    private void loadTodayBookings() {
        // GET /api/reservations, filter for today by date prefix, and render upcoming booking cards
        new Thread(() -> {
            try {
                Request req = ApiClient.buildAuthRequest(this, "reservations").get().build();
                try (Response res = ApiClient.getClient().newCall(req).execute()) {
                    if (res.body() != null) {
                        String responseBody = res.body().string();
                        JSONArray array = new JSONArray(responseBody);

                        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());

                        runOnUiThread(() -> {
                            if (layoutTodayBookings == null) return;
                            layoutTodayBookings.removeAllViews();
                            int foundCount = 0;
                            for (int i = 0; i < array.length(); i++) {
                                try {
                                    JSONObject b = array.getJSONObject(i);
                                    String scheduled = b.optString("scheduledDateTime", "");

                                    if (scheduled.startsWith(today)) {
                                        foundCount++;
                                        View card = LayoutInflater.from(this).inflate(R.layout.item_energy_transfer, layoutTodayBookings, false);

                                        TextView tvDate = card.findViewById(R.id.tv_transfer_date);
                                        TextView tvHub = card.findViewById(R.id.tv_transfer_hub);
                                        TextView tvTime = card.findViewById(R.id.tv_transfer_time);
                                        TextView tvStatus = card.findViewById(R.id.tv_transfer_status);
                                        TextView tvEnergy = card.findViewById(R.id.tv_transfer_energy);

                                        String prosumer = b.optString("prosumerName", "Unknown Prosumer");
                                        if (tvDate != null) tvDate.setText(prosumer);
                                        if (tvHub != null)  tvHub.setText("Node: " + b.optString("stationName"));

                                        String time = scheduled.length() >= 16 ? scheduled.substring(11, 16) : "N/A";
                                        if (tvTime != null) tvTime.setText(time);

                                        String status = b.optString("status");
                                        if (tvStatus != null) {
                                            tvStatus.setText(status);
                                            if ("Completed".equals(status)) tvStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));
                                            else if ("Pending".equals(status)) tvStatus.setTextColor(ContextCompat.getColor(this, R.color.neuro_amber));
                                        }

                                        if (tvEnergy != null) tvEnergy.setText(b.optDouble("energyAmountKWh", 0) + " kWh");

                                        layoutTodayBookings.addView(card);
                                    }
                                } catch (Exception ignored) {}
                            }

                            if (foundCount == 0) {
                                TextView tvNone = new TextView(this);
                                tvNone.setText("No bookings scheduled for today.");
                                tvNone.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
                                tvNone.setPadding(16, 16, 16, 16);
                                layoutTodayBookings.addView(tvNone);
                            }
                        });
                    }
                }
            } catch (Exception ignored) {}
        }).start();
    }

    @Override
    protected void onResume() {
        // Refresh all live dashboard data whenever operator returns to this screen
        super.onResume();
        loadDashboardStats();
        loadStations();
        loadTodayBookings();
    }
}
