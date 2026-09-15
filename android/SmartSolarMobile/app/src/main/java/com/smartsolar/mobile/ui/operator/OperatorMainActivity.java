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

        // Nav Labels
        tvNavHome     = findViewById(R.id.tv_nav_home);
        tvNavNodes    = findViewById(R.id.tv_nav_nodes);
        tvNavBookings = findViewById(R.id.tv_nav_bookings);
        tvNavHistory  = findViewById(R.id.tv_nav_history);
        tvNavProfile  = findViewById(R.id.tv_nav_profile);
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
                
                String scheduled = h.optString("scheduledDateTime", "").replace("T", " ").substring(0, 16);
                holder.tvTimestamp.setText("Completed: " + scheduled);
                
                holder.tvEnergy.setText(h.optDouble("energyAmountKWh", 0.0) + " kWh");

                String status = h.optString("status", "Pending");
                if ("Completed".equalsIgnoreCase(status)) {
                    holder.tvStatus.setTextColor(ContextCompat.getColor(OperatorMainActivity.this, R.color.neuro_text_green));
                    holder.tvStatus.setText(status.toUpperCase());
                } else if ("Approved".equalsIgnoreCase(status)) {
                    holder.tvStatus.setTextColor(ContextCompat.getColor(OperatorMainActivity.this, R.color.neuro_blue));
                    holder.tvStatus.setText(status.toUpperCase());
                } else {
                    holder.tvStatus.setTextColor(ContextCompat.getColor(OperatorMainActivity.this, R.color.neuro_text_muted));
                    holder.tvStatus.setText(status.toUpperCase());
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
        // Initialise RecyclerView, status spinner, search watcher, and load all reservations
        final RecyclerView rv = findViewById(R.id.recycler_operator_bookings);
        final EditText etSearch = findViewById(R.id.et_booking_search);
        final Spinner spinnerStatus = findViewById(R.id.spinner_status_filter);

        if (rv == null) return;

        if (!isBookingsInitialized) {
            rv.setLayoutManager(new LinearLayoutManager(this));
            operatorBookingsAdapter = new BookingsAdapter(filteredBookingsList);
            rv.setAdapter(operatorBookingsAdapter);

            // Populate status filters mapping project criteria (All, Pending, Approved, Cancelled, Completed)
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
                
                String prosumer = b.optString("prosumerName", "Prosumer Agent");
                String nic = b.optString("prosumerNic", "N/A");
                holder.tvStation.setText(prosumer + " (" + nic + ")\nNode: " + b.optString("stationName"));

                String scheduled = b.optString("scheduledDateTime", "");
                String time = scheduled.length() >= 16 ? scheduled.substring(11, 16) : "N/A";
                String date = scheduled.length() >= 10 ? scheduled.substring(0, 10) : scheduled;
                holder.tvDate.setText(date + " " + time);

                holder.tvEnergy.setText(b.optDouble("energyAmountKWh", 0.0) + " kWh");
                if (holder.tvCost != null) {
                    holder.tvCost.setVisibility(View.GONE);
                }

                String status = b.optString("status", "Pending");
                holder.tvStatus.setText(status);

                if ("Completed".equalsIgnoreCase(status)) {
                    holder.tvStatus.setTextColor(ContextCompat.getColor(OperatorMainActivity.this, R.color.neuro_text_green));
                } else if ("Pending".equalsIgnoreCase(status)) {
                    holder.tvStatus.setTextColor(ContextCompat.getColor(OperatorMainActivity.this, R.color.neuro_amber));
                } else if ("Cancelled".equalsIgnoreCase(status)) {
                    holder.tvStatus.setTextColor(ContextCompat.getColor(OperatorMainActivity.this, R.color.neuro_danger));
                } else {
                    holder.tvStatus.setTextColor(ContextCompat.getColor(OperatorMainActivity.this, R.color.neuro_blue));
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
            TextView tvCode, tvStation, tvEnergy, tvStatus, tvDate, tvCost;
            VH(View v) { super(v);
                tvCode = v.findViewById(R.id.tv_booking_code);
                tvStation = v.findViewById(R.id.tv_booking_station);
                tvEnergy = v.findViewById(R.id.tv_booking_energy);
                tvStatus = v.findViewById(R.id.tv_booking_status);
                tvDate = v.findViewById(R.id.tv_booking_date);
                tvCost = v.findViewById(R.id.tv_booking_cost);
            }
        }
    }


}