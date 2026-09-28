package com.smartsolar.mobile.ui.prosumer;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.data.SessionManager;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_energy_transfer_history);

        sessionManager = new SessionManager(this);

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());

        recyclerView = findViewById(R.id.recycler_transfers);
        tvEmpty      = findViewById(R.id.tv_empty);
        progressBar   = findViewById(R.id.progress_bar);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new TransferAdapter(transferList);
        recyclerView.setAdapter(adapter);
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

            try {
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
}