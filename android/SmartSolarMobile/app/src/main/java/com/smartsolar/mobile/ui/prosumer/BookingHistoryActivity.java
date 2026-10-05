// ============================================================================
// File: BookingHistoryActivity.java
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Prosumer booking history list with 4 status tabs, real-time search filter, and localized timestamps.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.DatabaseHelper;
import com.smartsolar.mobile.data.SessionManager;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;

public class BookingHistoryActivity extends AppCompatActivity {

    private EditText etSearch;
    private RecyclerView recyclerView;
    private TextView tvEmpty, tvTotalTraded, tvTotalValue;
    private View progressBar;
    private SessionManager sessionManager;
    private List<JSONObject> bookingList = new ArrayList<>();
    private BookingHistoryAdapter adapter;
    private String currentStatusFilter = "";

    private TextView tabAll, tabCompleted, tabApproved, tabPending, tabCancelled;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Initialise session, bind views, setup RecyclerView with adapter, wire search and status tabs
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_history);

        sessionManager = new SessionManager(this);

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());

        etSearch      = findViewById(R.id.et_search);
        recyclerView  = findViewById(R.id.recycler_bookings);
        tvEmpty       = findViewById(R.id.tv_empty);
        tvTotalTraded = findViewById(R.id.tv_total_traded);
        tvTotalValue  = findViewById(R.id.tv_total_value);
        progressBar   = findViewById(R.id.progress_bar);

        tabAll        = findViewById(R.id.tab_all);
        tabCompleted  = findViewById(R.id.tab_completed);
        tabApproved   = findViewById(R.id.tab_approved);
        tabPending    = findViewById(R.id.tab_pending);
        tabCancelled  = findViewById(R.id.tab_cancelled);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new BookingHistoryAdapter(bookingList, booking -> {
            Intent intent = new Intent(this, BookingDetailActivity.class);
            try { intent.putExtra("reservation_id", booking.getString("id")); } catch (Exception ignored) {}
            startActivity(intent);
        });
        recyclerView.setAdapter(adapter);

        setupTabs();

        etSearch.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) { loadBookings(); }
            @Override public void afterTextChanged(Editable s) {}
        });

        loadBookings();
    }

    private void setupTabs() {
        // Attach click listeners to All, Completed, Approved, Pending and Cancelled tabs
        View.OnClickListener listener = v -> {
            tabAll.setBackground(null);
            tabCompleted.setBackground(null);
            tabApproved.setBackground(null);
            tabPending.setBackground(null);
            tabCancelled.setBackground(null);
            tabAll.setTextColor(getResources().getColor(R.color.white));
            tabCompleted.setTextColor(getResources().getColor(R.color.white));
            tabApproved.setTextColor(getResources().getColor(R.color.white));
            tabPending.setTextColor(getResources().getColor(R.color.white));
            tabCancelled.setTextColor(getResources().getColor(R.color.white));

            v.setBackgroundResource(R.drawable.bg_tab_selected_pale);
            ((TextView)v).setTextColor(getResources().getColor(R.color.white));

            if (v.getId() == R.id.tab_all) currentStatusFilter = "";
            else if (v.getId() == R.id.tab_completed) currentStatusFilter = "Completed";
            else if (v.getId() == R.id.tab_approved) currentStatusFilter = "Approved";
            else if (v.getId() == R.id.tab_pending) currentStatusFilter = "Pending";
            else if (v.getId() == R.id.tab_cancelled) currentStatusFilter = "Cancelled";

            loadBookings();
        };

        tabAll.setOnClickListener(listener);
        tabCompleted.setOnClickListener(listener);
        tabApproved.setOnClickListener(listener);
        tabPending.setOnClickListener(listener);
        tabCancelled.setOnClickListener(listener);
    }

    private void loadBookings() {
        // Fetch filtered reservations from API, cache records in SQLite, and calculate trading KPIs
        String nic = sessionManager.getNic();
        String search = etSearch.getText().toString().trim();

        progressBar.setVisibility(View.VISIBLE);

        new Thread(() -> {
            try {
                String url = "reservations?prosumerNic=" + nic;
                if (!currentStatusFilter.isEmpty()) url += "&status=" + currentStatusFilter;
                if (!search.isEmpty()) url += "&search=" + URLEncoder.encode(search, "UTF-8");

                Request request = ApiClient.buildAuthRequest(this, url).get().build();
                Response response = ApiClient.getClient().newCall(request).execute();
                JSONArray array = new JSONArray(response.body().string());

                bookingList.clear();
                double totalTraded = 0;
                double totalValue = 0;

                for (int i = 0; i < array.length(); i++) {
                    JSONObject booking = array.getJSONObject(i);
                    // Cancelled tab shows plain cancellations only; operator-released
                    // bookings live in the transfer-history Op. Cancelled tab
                    if ("Cancelled".equalsIgnoreCase(currentStatusFilter)
                            && booking.optString("operatorNotes", "")
                                    .startsWith("Cancelled by Grid Operator")) {
                        continue;
                    }
                    bookingList.add(booking);
                        DatabaseHelper db = new DatabaseHelper(BookingHistoryActivity.this);
                        db.cacheEnergyReservation(
                            booking.optString("id"), booking.optString("reservationCode"), nic,
                            booking.optString("stationId"), booking.optString("stationName"),
                            booking.optString("scheduledDateTime"), booking.optInt("durationHours"),
                            booking.optDouble("energyAmountKWh"), booking.optDouble("totalCost"),
                            booking.optString("reservationType"), booking.optString("status"),
                            booking.optString("qrCodeData"));
                        db.close();
                    // Totals follow the visible tab: Completed-only on All/Completed tabs,
                    // the tab's own bookings on Pending/Approved tabs (never stuck at zero)
                    boolean isCompleted = booking.optString("status").equalsIgnoreCase("Completed");
                    if (currentStatusFilter.isEmpty() && !isCompleted) continue;
                    totalTraded += booking.optDouble("energyAmountKWh", 0);
                    totalValue += booking.optDouble("totalCost", 0);
                }

                final double fTotalTraded = totalTraded;
                final double fTotalValue = totalValue;

                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    adapter.notifyDataSetChanged();
                    tvEmpty.setVisibility(bookingList.isEmpty() ? View.VISIBLE : View.GONE);
                    tvTotalTraded.setText(String.format("%.1f", fTotalTraded));
                    tvTotalValue.setText(String.format("Rs. %.2f", fTotalValue));
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    tvEmpty.setText("Error loading data.");
                    tvEmpty.setVisibility(View.VISIBLE);
                });
            }
        }).start();
    }

    static class BookingHistoryAdapter extends RecyclerView.Adapter<BookingHistoryAdapter.VH> {
        interface OnItemClick { void onClick(JSONObject item); }
        private final List<JSONObject> items;
        private final OnItemClick listener;
        BookingHistoryAdapter(List<JSONObject> items, OnItemClick listener) {
            this.items = items; this.listener = listener;
        }
        @Override public VH onCreateViewHolder(ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_booking, parent, false);
            return new VH(v);
        }
        @Override public void onBindViewHolder(VH holder, int position) {
            JSONObject item = items.get(position);
            holder.tvCode.setText(item.optString("reservationCode"));
            holder.tvStation.setText(item.optString("stationName"));
            holder.tvEnergy.setText(item.optDouble("energyAmountKWh") + " kWh");
            
            String status = item.optString("status");
            holder.tvStatus.setText(status);
            styleStatusTag(holder.tvStatus, status);
            // Operator-released bookings show who cancelled them
            String opNotes = item.optString("operatorNotes", "");
            if (("Cancelled".equalsIgnoreCase(status) || "Canceled".equalsIgnoreCase(status))
                    && opNotes.startsWith("Cancelled by Grid Operator")) {
                holder.tvStatus.setText("Cancelled by operator");
            }
            if ("Missed".equalsIgnoreCase(status)) {
                holder.tvStatus.setText("Missed — No Show");
            }
            
            String scheduled = item.optString("scheduledDateTime");
            try {
                java.text.SimpleDateFormat utcParser = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault());
                utcParser.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                java.util.Date parsedDate = utcParser.parse(scheduled.length() > 19 ? scheduled.substring(0, 19) : scheduled);
                java.text.SimpleDateFormat localFmt = new java.text.SimpleDateFormat("dd MMM yyyy HH:mm", java.util.Locale.getDefault());
                localFmt.setTimeZone(java.util.TimeZone.getDefault());
                scheduled = localFmt.format(parsedDate);
            } catch (Exception ignored) {
                if (scheduled.length() >= 16) scheduled = scheduled.substring(0, 16).replace("T", " ");
            }
            holder.tvDate.setText(scheduled);
            holder.tvCost.setText(String.format("Rs. %.2f", item.optDouble("totalCost", 0)));
            
            holder.itemView.setOnClickListener(v -> listener.onClick(item));
        }
        @Override public int getItemCount() { return items.size(); }

        /** Status pill in its own palette color: Completed darkest … Cancelled lightest. */
        static void styleStatusTag(TextView tv, String status) {
            int bg;
            int fg;
            if ("Completed".equalsIgnoreCase(status)) {
                bg = Color.parseColor("#063127");
                fg = Color.WHITE;
            } else if ("Approved".equalsIgnoreCase(status)) {
                bg = Color.parseColor("#3B796A");
                fg = Color.WHITE;
            } else if ("Pending".equalsIgnoreCase(status)) {
                bg = Color.parseColor("#8FB3A9");
                fg = Color.parseColor("#063127");
            } else if ("Cancelled".equalsIgnoreCase(status) || "Canceled".equalsIgnoreCase(status)) {
                bg = Color.parseColor("#BFD5D0");
                fg = Color.parseColor("#063127");
            } else if ("Missed".equalsIgnoreCase(status)) {
                bg = Color.parseColor("#D97706"); // amber-600
                fg = Color.WHITE;
            } else {
                bg = Color.parseColor("#65998B");
                fg = Color.WHITE;
            }
            float density = tv.getResources().getDisplayMetrics().density;
            GradientDrawable pill = new GradientDrawable();
            pill.setShape(GradientDrawable.RECTANGLE);
            pill.setCornerRadius(20f * density);
            pill.setColor(bg);
            tv.setBackground(pill);
            tv.setTextColor(fg);
        }
        static class VH extends RecyclerView.ViewHolder {
            TextView tvCode, tvStation, tvEnergy, tvStatus, tvDate, tvCost;
            VH(View v) {
                super(v);
                tvCode    = v.findViewById(R.id.tv_booking_code);
                tvStation = v.findViewById(R.id.tv_booking_station);
                tvEnergy  = v.findViewById(R.id.tv_booking_energy);
                tvStatus  = v.findViewById(R.id.tv_booking_status);
                tvDate    = v.findViewById(R.id.tv_booking_date);
                tvCost    = v.findViewById(R.id.tv_booking_cost);
            }
        }
    }
}
