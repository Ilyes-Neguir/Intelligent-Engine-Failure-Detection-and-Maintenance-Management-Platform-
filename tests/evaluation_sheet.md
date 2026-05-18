# Evaluation Sheet

| Layer | Metric | Value | Target | Status | Details |
|---|---|---:|---:|---|---|
| Data | Max missing rate per feature (%) | 0.000 | <= 1.0 | PASS | Computed as max(null_count/total_rows*100) across all feature columns. |
| Data | Duplicate row rate (%) | 0.002 | <= 1.0 | PASS | Computed as duplicated_rows/total_rows*100. |
| Data | Class imbalance ratio | 1.4548 | <= 3.0 | PASS | Computed as largest_class_count/smallest_class_count. |
| Data | Train/Test leakage intersection size | 0 | == 0 | PASS | Computed as &#124;train_indices ∩ test_indices&#124;. |
| Data | Max PSI (train vs test) | 0.0017 | < 0.10 | PASS | PSI computed per feature with quantile bins from train distribution. |
| Model | Model metrics execution | N/A | Model/scaler present | SKIPPED | Skipped model metrics because model or scaler file is missing. |
| API | API runtime metrics | N/A | Run with --run-api | SKIPPED | API checks were skipped; start FastAPI and rerun with --run-api. |
| Backend | Backend runtime metrics | N/A | Run with --run-backend | SKIPPED | Backend checks were skipped; start backend and rerun with --run-backend. |
| Backend | System resource metrics | N/A | Provide --system-metrics-csv | SKIPPED | CPU/memory/queue metrics skipped (no system metrics CSV provided). |
