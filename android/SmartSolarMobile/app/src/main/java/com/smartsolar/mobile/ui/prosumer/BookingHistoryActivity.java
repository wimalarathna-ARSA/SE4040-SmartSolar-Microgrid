// ============================================================================
// File: BookingHistoryActivity.java
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Prosumer booking history list with 4 status tabs, real-time search filter, and localized timestamps.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.content.Intent;
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

    private TextView tabAll, tabCompleted, tabApproved, tabPending;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
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

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new BookingHistoryAdapter(bookingList);
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
        View.OnClickListener listener = v -> {
            tabAll.setBackground(null);
            tabCompleted.setBackground(null);
            tabApproved.setBackground(null);
            tabPending.setBackground(null);
            tabAll.setTextColor(getResources().getColor(R.color.neuro_text_muted));
            tabCompleted.setTextColor(getResources().getColor(R.color.neuro_text_muted));
            tabApproved.setTextColor(getResources().getColor(R.color.neuro_text_muted));
            tabPending.setTextColor(getResources().getColor(R.color.neuro_text_muted));

            v.setBackgroundResource(R.drawable.bg_neuro_tab_selected);
            ((TextView)v).setTextColor(getResources().getColor(R.color.neuro_green));

            if (v.getId() == R.id.tab_all) currentStatusFilter = "";
            else if (v.getId() == R.id.tab_completed) currentStatusFilter = "Completed";
            else if (v.getId() == R.id.tab_approved) currentStatusFilter = "Approved";
            else if (v.getId() == R.id.tab_pending) currentStatusFilter = "Pending";

            loadBookings();
        };

        tabAll.setOnClickListener(listener);
        tabCompleted.setOnClickListener(listener);
        tabApproved.setOnClickListener(listener);
        tabPending.setOnClickListener(listener);
    }

    private void loadBookings() {
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
                    if (booking.optString("status").equalsIgnoreCase("Completed")) {
                        totalTraded += booking.optDouble("energyAmountKWh", 0);
                        totalValue += booking.optDouble("totalCost", 0);
                    }
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
        private final List<JSONObject> items;

        BookingHistoryAdapter(List<JSONObject> items) {
            this.items = items;
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
        }

        @Override public int getItemCount() { return items.size(); }

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