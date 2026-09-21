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
import java.util.Locale;

/**
 * Station field inspection and battery slot adjustment screen
 * for Grid Operators.
 */
public class OperatorStationsActivity
        extends AppCompatActivity {

    private RecyclerView recyclerView;

    private View progressBar;

    private TextView tvEmpty;

    private List<JSONObject> stationList =
            new ArrayList<>();

    private StationAdapter adapter;

    @Override
    protected void onCreate(
            Bundle savedInstanceState
    ) {

        super.onCreate(savedInstanceState);

        setContentView(
                R.layout.activity_operator_stations
        );

        recyclerView =
                findViewById(
                        R.id.recycler_stations
                );

        progressBar =
                findViewById(
                        R.id.progress_bar
                );

        tvEmpty =
                findViewById(
                        R.id.tv_empty
                );

        findViewById(
                R.id.btn_back_header
        ).setOnClickListener(
                v -> finish()
        );

        recyclerView.setLayoutManager(
                new LinearLayoutManager(this)
        );

        adapter =
                new StationAdapter(
                        stationList,
                        this::showUpdateSlotsDialog
                );

        recyclerView.setAdapter(adapter);

        loadStations();
    }

    private void loadStations() {

        progressBar.setVisibility(
                View.VISIBLE
        );

        new Thread(() -> {

            try {

                Request request =
                        ApiClient
                                .buildAuthRequest(
                                        this,
                                        "stations"
                                )
                                .get()
                                .build();

                try (
                        Response response =
                                ApiClient
                                        .getClient()
                                        .newCall(request)
                                        .execute()
                ) {

                    if (response.body() == null) {
                        throw new Exception(
                                "Empty server response"
                        );
                    }

                    JSONArray array =
                            new JSONArray(
                                    response.body()
                                            .string()
                            );

                    stationList.clear();

                    for (
                            int i = 0;
                            i < array.length();
                            i++
                    ) {

                        stationList.add(
                                array.getJSONObject(i)
                        );
                    }

                    runOnUiThread(() -> {

                        progressBar.setVisibility(
                                View.GONE
                        );

                        adapter.notifyDataSetChanged();

                        tvEmpty.setVisibility(
                                stationList.isEmpty()
                                        ? View.VISIBLE
                                        : View.GONE
                        );
                    });
                }

            } catch (Exception e) {

                runOnUiThread(() -> {

                    progressBar.setVisibility(
                            View.GONE
                    );

                    Toast.makeText(
                            this,
                            "Unable to load stations: "
                                    + e.getMessage(),
                            Toast.LENGTH_SHORT
                    ).show();
                });
            }

        }).start();
    }

    private void showUpdateSlotsDialog(
            JSONObject station
    ) {

        try {

            String stationId =
                    station.getString("id");

            String stationName =
                    station.getString("name");

            int totalSlots =
                    station.getInt(
                            "totalBatterySlots"
                    );

            int currentSlots =
                    station.getInt(
                            "availableBatterySlots"
                    );

            AlertDialog.Builder builder =
                    new AlertDialog.Builder(this);

            builder.setTitle(
                    "Update Battery Slots: "
                            + stationName
            );

            EditText input =
                    new EditText(this);

            input.setInputType(
                    android.text.InputType
                            .TYPE_CLASS_NUMBER
            );

            input.setText(
                    String.valueOf(currentSlots)
            );

            input.setHint(
                    "Max: "
                            + totalSlots
                            + " slots"
            );

            builder.setView(input);

            builder.setPositiveButton(
                    "Update Slots",
                    (dialog, which) -> {

                        int newSlots;

                        try {

                            newSlots =
                                    Integer.parseInt(
                                            input.getText()
                                                    .toString()
                                                    .trim()
                                    );

                        } catch (
                                NumberFormatException e
                        ) {

                            Toast.makeText(
                                    this,
                                    "Enter a valid slot count.",
                                    Toast.LENGTH_SHORT
                            ).show();

                            return;
                        }

                        if (newSlots < 0) {

                            Toast.makeText(
                                    this,
                                    "Slots cannot be negative.",
                                    Toast.LENGTH_SHORT
                            ).show();

                            return;
                        }

                        if (newSlots > totalSlots) {

                            Toast.makeText(
                                    this,
                                    "Cannot exceed "
                                            + totalSlots
                                            + " total slots.",
                                    Toast.LENGTH_SHORT
                            ).show();

                            return;
                        }

                        updateSlots(
                                stationId,
                                newSlots
                        );
                    }
            );

            builder.setNegativeButton(
                    "Cancel",
                    null
            );

            builder.show();

        } catch (Exception ignored) {
        }
    }

    private void updateSlots(
            String stationId,
            int newSlots
    ) {

        new Thread(() -> {

            try {

                JSONObject body =
                        new JSONObject();

                body.put(
                        "availableBatterySlots",
                        newSlots
                );

                Request request =
                        ApiClient
                                .buildAuthRequest(
                                        this,
                                        "stations/"
                                                + stationId
                                                + "/battery-slots"
                                )
                                .put(
                                        ApiClient.jsonBody(body)
                                )
                                .build();

                try (
                        Response response =
                                ApiClient
                                        .getClient()
                                        .newCall(request)
                                        .execute()
                ) {

                    if (response.body() == null) {
                        throw new Exception(
                                "Empty server response"
                        );
                    }

                    JSONObject json =
                            new JSONObject(
                                    response.body()
                                            .string()
                            );

                    String message =
                            json.optString(
                                    "message",
                                    "Slots updated."
                            );

                    runOnUiThread(() -> {

                        Toast.makeText(
                                this,
                                message,
                                Toast.LENGTH_LONG
                        ).show();

                        loadStations();
                    });
                }

            } catch (Exception e) {

                runOnUiThread(() ->
                        Toast.makeText(
                                this,
                                "Update failed: "
                                        + e.getMessage(),
                                Toast.LENGTH_SHORT
                        ).show()
                );
            }

        }).start();
    }

    static class StationAdapter
            extends RecyclerView.Adapter<StationAdapter.VH> {

        interface OnUpdateSlots {
            void onClick(JSONObject station);
        }

        private final List<JSONObject> items;

        private final OnUpdateSlots listener;

        StationAdapter(
                List<JSONObject> items,
                OnUpdateSlots listener
        ) {

            this.items = items;
            this.listener = listener;
        }

        @Override
        public VH onCreateViewHolder(
                android.view.ViewGroup parent,
                int viewType
        ) {

            View view =
                    LayoutInflater
                            .from(parent.getContext())
                            .inflate(
                                    R.layout.item_station,
                                    parent,
                                    false
                            );

            return new VH(view);
        }

        @Override
        public void onBindViewHolder(
                VH holder,
                int position
        ) {

            JSONObject station =
                    items.get(position);

            holder.tvName.setText(
                    station.optString("name")
                            + " ["
                            + station.optString(
                            "stationCode"
                    )
                            + "]"
            );

            holder.tvLocation.setText(
                    station.optString(
                            "location"
                    )
            );

            holder.tvSlots.setText(
                    "Battery: "
                            + station.optInt(
                            "availableBatterySlots"
                    )
                            + "/"
                            + station.optInt(
                            "totalBatterySlots"
                    )
                            + " free"
            );

            String status =
                    station.optString(
                            "status",
                            "Active"
                    );

            holder.tvStatus.setText(
                    status.toUpperCase(
                            Locale.getDefault()
                    )
            );

            if (holder.tvMeta != null) {

                holder.tvMeta.setText(
                        station.optInt(
                                "activeReservationsCount",
                                0
                        )
                                + " bookings · "
                                + station.optString(
                                "stationCode",
                                ""
                        )
                );
            }

            // Professional thumbnail cycles through
            // the five solar-house artwork assets.
            if (holder.ivPhoto != null) {

                int[] art = {

                        R.drawable.house_solar_1,

                        R.drawable.house_solar_2,

                        R.drawable.house_solar_3,

                        R.drawable.house_solar_4,

                        R.drawable.house_solar_5
                };

                try {

                    holder.ivPhoto.setImageResource(
                            art[position % art.length]
                    );

                } catch (Exception ignored) {
                }
            }

            holder.btnUpdate.setOnClickListener(
                    v -> listener.onClick(station)
            );

            // Open detailed station insight screen.
            final String currentId =
                    station.optString("id");

            holder.itemView.setClickable(true);

            holder.itemView.setOnClickListener(
                    v -> {

                        Intent intent =
                                new Intent(
                                        v.getContext(),
                                        OperatorNodeDetailActivity.class
                                );

                        intent.putExtra(
                                "station_id",
                                currentId
                        );

                        v.getContext()
                                .startActivity(intent);
                    }
            );
        }

        @Override
        public int getItemCount() {
            return items.size();
        }

        static class VH
                extends RecyclerView.ViewHolder {

            TextView tvName,
                    tvLocation,
                    tvSlots,
                    tvStatus,
                    tvMeta;

            ImageView ivPhoto;

            Button btnUpdate;

            VH(View view) {

                super(view);

                tvName =
                        view.findViewById(
                                R.id.tv_station_name
                        );

                tvLocation =
                        view.findViewById(
                                R.id.tv_station_location
                        );

                tvSlots =
                        view.findViewById(
                                R.id.tv_station_slots
                        );

                tvStatus =
                        view.findViewById(
                                R.id.tv_station_status
                        );

                tvMeta =
                        view.findViewById(
                                R.id.tv_station_meta
                        );

                ivPhoto =
                        view.findViewById(
                                R.id.iv_station_photo
                        );

                btnUpdate =
                        view.findViewById(
                                R.id.btn_update_slots
                        );
            }
        }
    }
}