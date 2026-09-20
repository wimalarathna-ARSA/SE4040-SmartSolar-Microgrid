// ============================================================================
// File: OperatorStationsActivity.java
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator field inspection screen showing all solar stations
//              with battery slot status, capacity specs, and active bookings.
// Architecture: FAT Service Pattern - Slot updates committed to C# Web API
// ============================================================================

package com.smartsolar.mobile.ui.operator;

import android.os.Bundle;
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

public class OperatorStationsActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    private View progressBar;
    private TextView tvEmpty;

    private List<JSONObject> stationList =
            new ArrayList<>();

    private StationAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(
                R.layout.activity_operator_stations
        );

        recyclerView =
                findViewById(R.id.recycler_stations);

        progressBar =
                findViewById(R.id.progress_bar);

        tvEmpty =
                findViewById(R.id.tv_empty);

        findViewById(R.id.btn_back_header)
                .setOnClickListener(
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

                Response response =
                        ApiClient
                                .getClient()
                                .newCall(request)
                                .execute();

                JSONArray array =
                        new JSONArray(
                                response.body().string()
                        );

                stationList.clear();

                for (int i = 0;
                     i < array.length();
                     i++) {

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

            } catch (Exception e) {

                runOnUiThread(() ->
                        progressBar.setVisibility(
                                View.GONE
                        )
                );
            }

        }).start();
    }

    private void showUpdateSlotsDialog(
            JSONObject station
    ) {
        // Added in the next commit.
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
                    android.view.LayoutInflater
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
                            + station.optString("stationCode")
                            + "]"
            );

            holder.tvLocation.setText(
                    station.optString("location")
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
                            java.util.Locale.getDefault()
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

            holder.btnUpdate.setOnClickListener(
                    v -> listener.onClick(station)
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

            android.widget.ImageView ivPhoto;
            android.widget.Button btnUpdate;

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