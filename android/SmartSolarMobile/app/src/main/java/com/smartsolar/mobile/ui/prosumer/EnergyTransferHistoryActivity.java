// ============================================================================
// File: EnergyTransferHistoryActivity.java
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Completed energy transfer transaction history log with kWh metrics and financial totals.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.SessionManager;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class EnergyTransferHistoryActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    private TextView tvEmpty;
    private View progressBar;
    private SessionManager sessionManager;
    private List<JSONObject> transferList = new ArrayList<>();
    private TransferAdapter adapter;
    private TextView tvTabCompleted, tvTabMissed, tvTabOpCancelled, tvHeaderSub;
    private int currentTab = 0; // 0=Completed, 1=Missed, 2=Operator-cancelled

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Initialise session, bind RecyclerView with TransferAdapter, and trigger transfers fetch
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_energy_transfer_history);

        sessionManager = new SessionManager(this);

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());

        recyclerView = findViewById(R.id.recycler_transfers);
        tvEmpty      = findViewById(R.id.tv_empty);
        progressBar   = findViewById(R.id.progress_bar);
        tvTabCompleted = findViewById(R.id.tv_tab_completed);
        tvTabMissed = findViewById(R.id.tv_tab_missed);
        tvTabOpCancelled = findViewById(R.id.tv_tab_opcancelled);
        tvHeaderSub = findViewById(R.id.tv_header_sub);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new TransferAdapter(transferList);
        recyclerView.setAdapter(adapter);

        if (tvTabCompleted != null) tvTabCompleted.setOnClickListener(v -> selectTab(0));
        if (tvTabMissed != null) tvTabMissed.setOnClickListener(v -> selectTab(1));
        if (tvTabOpCancelled != null) tvTabOpCancelled.setOnClickListener(v -> selectTab(2));
        paintTabs();

        loadTransfers();
    }

    private void selectTab(int tab) {
        // Switch Completed / Missed / Operator-cancelled and reload for that slice
        if (currentTab == tab) return;
        currentTab = tab;
        paintTabs();
        loadTransfers();
    }

    private void paintTabs() {
        // Selected tab gets the white pill, others keep the green track text
        paintOneTab(tvTabCompleted, currentTab == 0);
        paintOneTab(tvTabMissed, currentTab == 1);
        paintOneTab(tvTabOpCancelled, currentTab == 2);
        if (tvHeaderSub != null) {
            tvHeaderSub.setText(currentTab == 1 ? "Missed bookings"
                    : currentTab == 2 ? "Cancelled by operator"
                    : "Completed grid transactions");
        }
    }

    private void paintOneTab(TextView tv, boolean selected) {
        if (tv == null) return;
        tv.setBackgroundResource(selected ? R.drawable.bg_segment_selected : 0);
        tv.setTypeface(null, selected
                ? android.graphics.Typeface.BOLD : android.graphics.Typeface.NORMAL);
    }

    private static boolean isOperatorCancelled(JSONObject b) {
        // Operator-released bookings carry the stamped release note
        return b.optString("operatorNotes", "").startsWith("Cancelled by Grid Operator");
    }

    private void loadTransfers() {
        // Completed: status=Completed · Missed / Op-cancelled: split status=Cancelled by release note
        String nic = sessionManager.getNic();
        progressBar.setVisibility(View.VISIBLE);
        final int tab = currentTab;

        new Thread(() -> {
            try {
                String url = "reservations?prosumerNic=" + nic
                        + (tab == 0 ? "&status=Completed" : "&status=Cancelled");
                Request request = ApiClient.buildAuthRequest(this, url).get().build();
                Response response = ApiClient.getClient().newCall(request).execute();
                
                if (response.body() != null) {
                    JSONArray array = new JSONArray(response.body().string());
                    transferList.clear();
                    for (int i = 0; i < array.length(); i++) {
                        JSONObject b = array.getJSONObject(i);
                        if (tab == 1 && isOperatorCancelled(b)) continue;
                        if (tab == 2 && !isOperatorCancelled(b)) continue;
                        transferList.add(b);
                    }

                    runOnUiThread(() -> {
                        progressBar.setVisibility(View.GONE);
                        adapter.notifyDataSetChanged();
                        tvEmpty.setText(tab == 1 ? "No missed bookings."
                                : tab == 2 ? "No operator-cancelled bookings."
                                : "No energy transfers found.");
                        tvEmpty.setVisibility(transferList.isEmpty() ? View.VISIBLE : View.GONE);
                    });
                }
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    tvEmpty.setText("Error loading transfers.");
                    tvEmpty.setVisibility(View.VISIBLE);
                });
            }
        }).start();
    }

    static class TransferAdapter extends RecyclerView.Adapter<TransferAdapter.VH> {
        private final List<JSONObject> items;
        TransferAdapter(List<JSONObject> items) { this.items = items; }

        @Override public VH onCreateViewHolder(ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_energy_transfer, parent, false);
            return new VH(v);
        }

        @Override public void onBindViewHolder(VH holder, int position) {
            JSONObject item = items.get(position);
            
            String hub = item.optString("stationName");
            double energy = item.optDouble("energyAmountKWh", 0);
            String status = item.optString("status");
            String isoDate = item.optString("scheduledDateTime");

            holder.tvHub.setText(hub);
            holder.tvEnergy.setText(String.format("%.1f kWh", energy));
            holder.tvStatus.setText(status);

            // Format Date and Time
            try {
                // Assuming format like "2026-09-23T10:30:00"
                SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
                Date date = parser.parse(isoDate);
                if (date != null) {
                    SimpleDateFormat dateFormatter = new SimpleDateFormat("dd MMM yyyy", Locale.getDefault());
                    SimpleDateFormat timeFormatter = new SimpleDateFormat("hh:mm a", Locale.getDefault());
                    holder.tvDate.setText(dateFormatter.format(date));
                    holder.tvTime.setText(timeFormatter.format(date));
                }
            } catch (Exception e) {
                holder.tvDate.setText(isoDate);
                holder.tvTime.setText("");
            }
        }

        @Override public int getItemCount() { return items.size(); }

        static class VH extends RecyclerView.ViewHolder {
            TextView tvDate, tvHub, tvTime, tvStatus, tvEnergy;
            VH(View v) {
                super(v);
                tvDate   = v.findViewById(R.id.tv_transfer_date);
                tvHub    = v.findViewById(R.id.tv_transfer_hub);
                tvTime   = v.findViewById(R.id.tv_transfer_time);
                tvStatus = v.findViewById(R.id.tv_transfer_status);
                tvEnergy = v.findViewById(R.id.tv_transfer_energy);
            }
        }
    }

    @Override
    protected void onDestroy() {
        // Close session manager and release database connections on activity teardown
        super.onDestroy();
        if (sessionManager != null) sessionManager.close();
    }
}
