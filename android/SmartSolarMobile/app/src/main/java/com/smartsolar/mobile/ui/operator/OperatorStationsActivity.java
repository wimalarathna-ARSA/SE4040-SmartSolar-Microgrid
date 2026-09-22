// ============================================================================
// File: OperatorStationsActivity.java
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator field inspection screen showing all solar stations
//              with battery slot status, capacity specs, and active bookings.
//              Allows operators to update available battery slots from the field.
// Architecture: FAT Service Pattern - Slot updates committed to C# Web API
// ============================================================================
package com.smartsolar.mobile.ui.operator;

import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/** Station field inspection and battery slot adjustment screen for Grid Operators. */
public class OperatorStationsActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    private View progressBar;
    private TextView tvEmpty;
    private List<JSONObject> stationList = new ArrayList<>();
    private StationAdapter adapter;

    /** Initializes station list and loads data from C# Web API. */
    // Sets up RecyclerView and fetches station telemetry
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Bind RecyclerView, setup linear layout manager with adapter, and trigger station load
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_operator_stations);

        recyclerView = findViewById(R.id.recycler_stations);
        progressBar  = findViewById(R.id.progress_bar);
        tvEmpty      = findViewById(R.id.tv_empty);

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new StationAdapter(stationList, this::showUpdateSlotsDialog);
        recyclerView.setAdapter(adapter);

        loadStations();
    }

    /** Fetches all solar stations from C# Web API. */
    // Calls GET /api/stations and populates RecyclerView
    private void loadStations() {
        // Call GET /api/stations to retrieve fleet stations and populate RecyclerView adapter
        progressBar.setVisibility(View.VISIBLE);
        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this, "stations").get().build();
                Response response = ApiClient.getClient().newCall(request).execute();
                JSONArray array = new JSONArray(response.body().string());
                stationList.clear();
                for (int i = 0; i < array.length(); i++) stationList.add(array.getJSONObject(i));
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    adapter.notifyDataSetChanged();
                    tvEmpty.setVisibility(stationList.isEmpty() ? View.VISIBLE : View.GONE);
                });
            } catch (Exception e) {
                runOnUiThread(() -> progressBar.setVisibility(View.GONE));
            }
        }).start();
    }

    /** Shows dialog for operator to update available battery slots for a station. */
    // Calls PUT /api/stations/{id}/battery-slots with new slot count
    private void showUpdateSlotsDialog(JSONObject station) {
        // Display alert dialog with number input for operator to adjust available battery slots
        try {
            String stationId   = station.getString("id");
            String stationName = station.getString("name");
            int totalSlots     = station.getInt("totalBatterySlots");
            int currentSlots   = station.getInt("availableBatterySlots");

            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("Update Battery Slots: " + stationName);

            EditText input = new EditText(this);
            input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
            input.setText(String.valueOf(currentSlots));
            input.setHint("Max: " + totalSlots + " slots");
            builder.setView(input);

            builder.setPositiveButton("Update Slots", (dialog, which) -> {
                int newSlots;
                try { newSlots = Integer.parseInt(input.getText().toString().trim()); }
                catch (NumberFormatException e) { return; }
                if (newSlots > totalSlots) { Toast.makeText(this, "Cannot exceed " + totalSlots + " total slots.", Toast.LENGTH_SHORT).show(); return; }
                updateSlots(stationId, newSlots);
            });
            builder.setNegativeButton("Cancel", null);
            builder.show();
        } catch (Exception ignored) {}
    }

    /** Submits battery slot update to C# Web API. */
    // Calls PUT /api/stations/{id}/battery-slots with new available count
    private void updateSlots(String stationId, int newSlots) {
        // PUT /api/stations/{id}/battery-slots with updated available slot count and refresh list
        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("availableBatterySlots", newSlots);
                Request request = ApiClient.buildAuthRequest(this, "stations/" + stationId + "/battery-slots")
                        .put(ApiClient.jsonBody(body)).build();
                Response response = ApiClient.getClient().newCall(request).execute();
                JSONObject json = new JSONObject(response.body().string());
                String msg = json.optString("message", "Slots updated.");
                runOnUiThread(() -> {
                    Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
                    loadStations(); // Refresh list
                });
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(this, "Update failed: " + e.getMessage(), Toast.LENGTH_SHORT).show());
            }
        }).start();
    }

    /** Minimal RecyclerView adapter for station list. */
    // Displays station code, name, battery slots, status, and active reservations
    static class StationAdapter extends RecyclerView.Adapter<StationAdapter.VH> {
        interface OnUpdateSlots { void onClick(JSONObject s); }
        private final List<JSONObject> items;
        private final OnUpdateSlots listener;
        StationAdapter(List<JSONObject> items, OnUpdateSlots listener) { this.items = items; this.listener = listener; }
        @Override public VH onCreateViewHolder(android.view.ViewGroup parent, int viewType) {
            View v = android.view.LayoutInflater.from(parent.getContext()).inflate(R.layout.item_station, parent, false);
            return new VH(v);
        }
        @Override public void onBindViewHolder(VH holder, int position) {
            JSONObject s = items.get(position);
            holder.tvName.setText(s.optString("name") + " [" + s.optString("stationCode") + "]");
            holder.tvLocation.setText(s.optString("location"));
            holder.tvSlots.setText("Battery: " + s.optInt("availableBatterySlots") + "/" + s.optInt("totalBatterySlots") + " free");
            String status = s.optString("status", "Active");
            holder.tvStatus.setText(status.toUpperCase(java.util.Locale.getDefault()));
            if (holder.tvMeta != null) {
                holder.tvMeta.setText(s.optInt("activeReservationsCount", 0) + " bookings · "
                        + s.optString("stationCode", ""));
            }
            // Professional thumbnail — cycles the 5 solar-house photos.
            if (holder.ivPhoto != null) {
                int[] art = {
                        com.smartsolar.mobile.R.drawable.house_solar_1,
                        com.smartsolar.mobile.R.drawable.house_solar_2,
                        com.smartsolar.mobile.R.drawable.house_solar_3,
                        com.smartsolar.mobile.R.drawable.house_solar_4,
                        com.smartsolar.mobile.R.drawable.house_solar_5 };
                try { holder.ivPhoto.setImageResource(art[position % art.length]); }
                catch (Exception ignored) {}
            }
            holder.btnUpdate.setOnClickListener(v -> listener.onClick(s));
            
            // Navigate to detailed insight panel when item card cell itself is tapped
            final String currentId = s.optString("id");
            holder.itemView.setClickable(true);
            holder.itemView.setOnClickListener(v -> {
                Intent intent = new Intent(v.getContext(), OperatorNodeDetailActivity.class);
                intent.putExtra("station_id", currentId);
                v.getContext().startActivity(intent);
            });
        }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder {
            TextView tvName, tvLocation, tvSlots, tvStatus, tvMeta;
            android.widget.ImageView ivPhoto;
            android.widget.Button btnUpdate;
            VH(View v) { super(v);
                tvName = v.findViewById(R.id.tv_station_name);
                tvLocation = v.findViewById(R.id.tv_station_location);
                tvSlots = v.findViewById(R.id.tv_station_slots);
                tvStatus = v.findViewById(R.id.tv_station_status);
                tvMeta = v.findViewById(R.id.tv_station_meta);
                ivPhoto = v.findViewById(R.id.iv_station_photo);
                btnUpdate = v.findViewById(R.id.btn_update_slots);
            }
        }
    }
}