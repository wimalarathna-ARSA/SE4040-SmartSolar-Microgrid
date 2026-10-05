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
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


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
        // Cream iPhone-style sheet with huge number, bay slot grid, steppers and dark pill save
        try {
            String stationId   = station.getString("id");
            String stationName = station.getString("name");
            int totalSlots     = station.getInt("totalBatterySlots");
            int currentSlots   = station.getInt("availableBatterySlots");

            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            View view = LayoutInflater.from(this).inflate(R.layout.dialog_adjust_slots, null, false);
            builder.setView(view);

            TextView tvStation  = view.findViewById(R.id.tv_adjust_station);
            TextView tvRatio    = view.findViewById(R.id.tv_adjust_ratio);
            TextView tvValue    = view.findViewById(R.id.tv_slots_value);
            TextView tvHint     = view.findViewById(R.id.tv_slots_hint);
            TextView tvSegTotal = view.findViewById(R.id.tv_seg_total);
            View btnSave        = view.findViewById(R.id.btn_save_slots);
            View btnCancel      = view.findViewById(R.id.btn_cancel_slots);
            GridLayout gridSlots = view.findViewById(R.id.grid_dialog_slots);

            final int[] slots = { Math.max(0, Math.min(currentSlots, totalSlots)) };

            Runnable render = () -> {
                if (tvStation != null) tvStation.setText(stationName);
                if (tvValue != null) tvValue.setText(String.valueOf(slots[0]));
                if (tvRatio != null) tvRatio.setText(slots[0] + " / " + totalSlots + " free");
                if (tvHint != null) tvHint.setText("Tap bays to toggle · Max: " + totalSlots + " slots");
                if (tvSegTotal != null) tvSegTotal.setText("Total " + totalSlots);
            };
            render.run();

            // ── Build bay slot grid with in-place selection (no popup dialog) ──
            if (gridSlots != null) {
                gridSlots.removeAllViews();

                final Set<Integer> occupiedSlots = new HashSet<>();
                JSONArray occupiedArr = station.optJSONArray("occupiedSlotNumbers");
                if (occupiedArr != null) {
                    for (int j = 0; j < occupiedArr.length(); j++) occupiedSlots.add(occupiedArr.optInt(j));
                }

                final Set<Integer> originalBusySlots = new HashSet<>();
                JSONArray busyArr = station.optJSONArray("busySlotNumbers");
                if (busyArr != null) {
                    for (int j = 0; j < busyArr.length(); j++) originalBusySlots.add(busyArr.optInt(j));
                }

                final Set<Integer> currentBusySlots = new HashSet<>(originalBusySlots);
                final Set<Integer> releasedBookedSlots = new HashSet<>();

                for (int i = 1; i <= totalSlots; i++) {
                    final int slotNum = i;
                    boolean isBusy     = originalBusySlots.contains(slotNum);
                    boolean isOccupied = occupiedSlots.contains(slotNum);

                    TextView tvSlot = new TextView(this);
                    GridLayout.LayoutParams params = new GridLayout.LayoutParams();
                    params.width  = dpToPx(48);
                    params.height = dpToPx(48);
                    params.setMargins(dpToPx(4), dpToPx(4), dpToPx(4), dpToPx(4));
                    tvSlot.setLayoutParams(params);
                    tvSlot.setGravity(Gravity.CENTER);
                    tvSlot.setText(String.valueOf(i));
                    tvSlot.setTextSize(12f);
                    tvSlot.setTypeface(null, Typeface.BOLD);
                    tvSlot.setClickable(true);
                    tvSlot.setFocusable(true);

                    if (isBusy) {
                        tvSlot.setBackgroundResource(R.drawable.bg_slot_busy);
                        tvSlot.setTextColor(Color.parseColor("#D97706"));
                    } else if (isOccupied) {
                        tvSlot.setBackgroundResource(R.drawable.bg_slot_booked);
                        tvSlot.setTextColor(Color.parseColor("#F43F5E"));
                    } else {
                        tvSlot.setBackgroundResource(R.drawable.bg_slot_free);
                        tvSlot.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));
                    }

                    // In-place selection toggle without popup dialog:
                    // Clicking slot toggles its state and updates the available count on screen
                    tvSlot.setOnClickListener(v -> {
                        if (occupiedSlots.contains(slotNum)) {
                            // Booked slot: toggle released state
                            if (releasedBookedSlots.contains(slotNum)) {
                                releasedBookedSlots.remove(slotNum);
                                tvSlot.setBackgroundResource(R.drawable.bg_slot_booked);
                                tvSlot.setTextColor(Color.parseColor("#F43F5E"));
                            } else {
                                releasedBookedSlots.add(slotNum);
                                tvSlot.setBackgroundResource(R.drawable.bg_slot_free);
                                tvSlot.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));
                            }
                        } else if (currentBusySlots.contains(slotNum)) {
                            // Busy slot: toggle to free
                            currentBusySlots.remove(slotNum);
                            tvSlot.setBackgroundResource(R.drawable.bg_slot_free);
                            tvSlot.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));
                        } else {
                            // Free slot: toggle to busy
                            currentBusySlots.add(slotNum);
                            tvSlot.setBackgroundResource(R.drawable.bg_slot_busy);
                            tvSlot.setTextColor(Color.parseColor("#D97706"));
                        }

                        // Recalculate available slots based on toggled states
                        int unavailable = (occupiedSlots.size() - releasedBookedSlots.size()) + currentBusySlots.size();
                        slots[0] = Math.max(0, Math.min(totalSlots, totalSlots - unavailable));
                        render.run();
                    });

                    gridSlots.addView(tvSlot);
                }

                AlertDialog dialog = builder.create();
                if (dialog.getWindow() != null) {
                    dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
                }
                if (btnSave != null) btnSave.setOnClickListener(v -> {
                    Set<Integer> newlyBusy = new HashSet<>();
                    for (int sNum : currentBusySlots) {
                        if (!originalBusySlots.contains(sNum)) {
                            newlyBusy.add(sNum);
                        }
                    }

                    Set<Integer> newlyReleased = new HashSet<>(releasedBookedSlots);
                    for (int sNum : originalBusySlots) {
                        if (!currentBusySlots.contains(sNum)) {
                            newlyReleased.add(sNum);
                        }
                    }

                    if (releasedBookedSlots.isEmpty()) {
                        dialog.dismiss();
                        saveSlotChanges(stationId, slots[0], newlyBusy, newlyReleased);
                    } else {
                        // Booked slots are being freed: confirm releasing before cancelling prosumer bookings
                        fetchReleaseTargetsAndConfirm(dialog, stationId, stationName, slots[0],
                                newlyBusy, newlyReleased, releasedBookedSlots);
                    }
                });
                if (btnCancel != null) btnCancel.setOnClickListener(v -> dialog.dismiss());
                dialog.show();
                return;
            }

            // Fallback if grid not found
            AlertDialog dialog = builder.create();
            if (dialog.getWindow() != null) {
                dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
            }
            if (btnSave != null) btnSave.setOnClickListener(v -> {
                dialog.dismiss();
                saveSlotChanges(stationId, slots[0], new HashSet<>(), new HashSet<>());
            });
            if (btnCancel != null) btnCancel.setOnClickListener(v -> dialog.dismiss());
            dialog.show();

        } catch (Exception ignored) {}
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density);
    }

    /**
     * Looks up the active prosumer bookings sitting on the booked slots being
     * freed, then asks the operator to confirm releasing them (they will be
     * cancelled and shown as operator-cancelled on the prosumer side).
     */
    private void fetchReleaseTargetsAndConfirm(AlertDialog adjustDialog, String stationId,
                                               String stationName, int newSlots,
                                               Set<Integer> newlyBusy, Set<Integer> newlyReleased,
                                               Set<Integer> releasedBookedSlots) {
        Toast.makeText(this, "Checking booked slots…", Toast.LENGTH_SHORT).show();
        new Thread(() -> {
            try {
                Request req = ApiClient.buildAuthRequest(this, "reservations").get().build();
                try (Response res = ApiClient.getClient().newCall(req).execute()) {
                    List<String[]> targets = new ArrayList<>();
                    if (res.body() != null) {
                        JSONArray array = new JSONArray(res.body().string());
                        for (int i = 0; i < array.length(); i++) {
                            JSONObject b = array.getJSONObject(i);
                            if (!stationId.equals(b.optString("stationId"))) continue;
                            String st = b.optString("status", "");
                            if (!"Pending".equalsIgnoreCase(st) && !"Approved".equalsIgnoreCase(st)) continue;
                            int slotNum = b.optInt("slotNumber", -1);
                            if (releasedBookedSlots.contains(slotNum)) {
                                targets.add(new String[]{
                                        "Slot #" + slotNum,
                                        b.optString("reservationCode", "RES-?"),
                                        b.optString("prosumerName", "Prosumer")});
                            }
                        }
                    }
                    runOnUiThread(() -> showReleaseConfirmDialog(adjustDialog, stationId,
                            newSlots, newlyBusy, newlyReleased, releasedBookedSlots.size(), targets));
                }
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(this,
                        "Could not verify booked slots: " + e.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    /** Professional confirm sheet before booked slots are released and their bookings cancelled. */
    private void showReleaseConfirmDialog(AlertDialog adjustDialog, String stationId, int newSlots,
                                          Set<Integer> newlyBusy, Set<Integer> newlyReleased,
                                          int releasedCount, List<String[]> targets) {
        View view = LayoutInflater.from(this).inflate(R.layout.dialog_confirm_release, null, false);
        LinearLayout container = view.findViewById(R.id.layout_release_lines);

        if (container != null) {
            if (targets.isEmpty()) {
                TextView tv = new TextView(this);
                tv.setText(releasedCount + (releasedCount == 1 ? " booked slot" : " booked slots") + " marked for release");
                tv.setTextSize(13);
                tv.setTypeface(null, Typeface.BOLD);
                tv.setTextColor(Color.parseColor("#063127"));
                tv.setPadding(0, dpToPx(10), 0, dpToPx(10));
                container.addView(tv);
            } else {
                for (int i = 0; i < targets.size(); i++) {
                    String[] t = targets.get(i);

                    LinearLayout row = new LinearLayout(this);
                    row.setOrientation(LinearLayout.HORIZONTAL);
                    row.setGravity(Gravity.CENTER_VERTICAL);
                    row.setPadding(0, dpToPx(10), 0, dpToPx(10));

                    View dot = new View(this);
                    LinearLayout.LayoutParams dotParams = new LinearLayout.LayoutParams(dpToPx(10), dpToPx(10));
                    dot.setLayoutParams(dotParams);
                    try { dot.setBackgroundResource(R.drawable.bg_dot_orange); } catch (Exception ignored) {}
                    row.addView(dot);

                    LinearLayout col = new LinearLayout(this);
                    col.setOrientation(LinearLayout.VERTICAL);
                    LinearLayout.LayoutParams colParams = new LinearLayout.LayoutParams(
                            0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
                    colParams.leftMargin = dpToPx(10);
                    col.setLayoutParams(colParams);

                    TextView tvSlot = new TextView(this);
                    tvSlot.setText(t[0]);
                    tvSlot.setTextSize(13);
                    tvSlot.setTypeface(null, Typeface.BOLD);
                    tvSlot.setTextColor(Color.parseColor("#063127"));
                    col.addView(tvSlot);

                    TextView tvBooking = new TextView(this);
                    tvBooking.setText(t[1] + " · " + t[2]);
                    tvBooking.setTextSize(12);
                    tvBooking.setTextColor(Color.parseColor("#65998B"));
                    col.addView(tvBooking);

                    row.addView(col);
                    container.addView(row);

                    if (i < targets.size() - 1) {
                        View divider = new View(this);
                        divider.setLayoutParams(new LinearLayout.LayoutParams(
                                LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(1)));
                        divider.setBackgroundColor(Color.parseColor("#BFD5D0"));
                        container.addView(divider);
                    }
                }
            }
        }

        AlertDialog confirm = new AlertDialog.Builder(this).setView(view).create();
        if (confirm.getWindow() != null) {
            confirm.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }
        View btnGo = view.findViewById(R.id.btn_release_go);
        if (btnGo != null) btnGo.setOnClickListener(v -> {
            confirm.dismiss();
            adjustDialog.dismiss();
            saveSlotChanges(stationId, newSlots, newlyBusy, newlyReleased);
        });
        View btnBack = view.findViewById(R.id.btn_release_back);
        if (btnBack != null) btnBack.setOnClickListener(v -> confirm.dismiss());
        confirm.show();
    }

    /**
     * Commits all slot changes and available count to C# Web API on "Save Slots".
     */
    private void saveSlotChanges(String stationId, int newSlots, Set<Integer> newlyBusy, Set<Integer> newlyReleased) {
        if (progressBar != null) progressBar.setVisibility(View.VISIBLE);
        new Thread(() -> {
            try {
                // Apply newly busy slots
                for (int slotNum : newlyBusy) {
                    JSONObject b = new JSONObject();
                    b.put("isBusy", true);
                    Request req = ApiClient.buildAuthRequest(this, "stations/" + stationId + "/slots/" + slotNum + "/busy")
                            .put(ApiClient.jsonBody(b)).build();
                    try (Response r = ApiClient.getClient().newCall(req).execute()) {}
                }

                // Apply newly released slots
                for (int slotNum : newlyReleased) {
                    RequestBody empty = RequestBody.create(new byte[0], null);
                    Request req = ApiClient.buildAuthRequest(this, "stations/" + stationId + "/slots/" + slotNum + "/release")
                            .post(empty).build();
                    try (Response r = ApiClient.getClient().newCall(req).execute()) {}
                }

                // Update available battery slots count
                JSONObject body = new JSONObject();
                body.put("availableBatterySlots", newSlots);
                Request request = ApiClient.buildAuthRequest(this, "stations/" + stationId + "/battery-slots")
                        .put(ApiClient.jsonBody(body)).build();
                try (Response r = ApiClient.getClient().newCall(request).execute()) {}

                runOnUiThread(() -> {
                    if (progressBar != null) progressBar.setVisibility(View.GONE);
                    Toast.makeText(this, "Slots updated successfully.", Toast.LENGTH_SHORT).show();
                    loadStations();
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    if (progressBar != null) progressBar.setVisibility(View.GONE);
                    Toast.makeText(this, "Update error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    loadStations();
                });
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