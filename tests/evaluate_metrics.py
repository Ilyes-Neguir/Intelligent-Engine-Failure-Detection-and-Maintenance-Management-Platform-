#!/usr/bin/env python3
"""
Compute and consolidate evaluation metrics for:
- Data quality/drift
- Model performance/stability
- FastAPI runtime behavior
- Spring backend diagnostic endpoint behavior
"""

from __future__ import annotations

import argparse
import math
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
import requests
from sklearn.metrics import (
    average_precision_score,
    precision_recall_fscore_support,
    roc_auc_score,
    f1_score,
)
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import label_binarize

try:
    from tensorflow import keras
except (ImportError, ModuleNotFoundError):  # pragma: no cover
    keras = None


FEATURE_COLUMNS = [
    "MAP",
    "TPS",
    "Force",
    "Power",
    "RPM",
    "Consumption L/H",
    "Consumption L/100KM",
    "Speed",
    "CO",
    "HC",
    "CO2",
    "O2",
    "Lambda",
    "AFR",
]
TARGET_COLUMN = "Fault"


@dataclass
class MetricRow:
    layer: str
    metric: str
    value: str
    target: str
    status: str
    details: str


def percentile(values: List[float], q: float) -> float:
    if not values:
        return float("nan")
    return float(np.percentile(values, q))


def fmt_float(v: float, digits: int = 4) -> str:
    if v is None or (isinstance(v, float) and (math.isnan(v) or math.isinf(v))):
        return "N/A"
    return f"{v:.{digits}f}"


def classify_low_better(v: float, pass_max: float, warn_max: float) -> str:
    if math.isnan(v):
        return "SKIPPED"
    if v <= pass_max:
        return "PASS"
    if v <= warn_max:
        return "WARNING"
    return "FAIL"


def classify_high_better(v: float, pass_min: float, warn_min: float) -> str:
    if math.isnan(v):
        return "SKIPPED"
    if v >= pass_min:
        return "PASS"
    if v >= warn_min:
        return "WARNING"
    return "FAIL"


def classify_exact_zero(v: float) -> str:
    if math.isnan(v):
        return "SKIPPED"
    return "PASS" if v == 0 else "FAIL"


def calc_psi(train_values: pd.Series, test_values: pd.Series, bins: int = 10) -> float:
    train_values = train_values.dropna()
    test_values = test_values.dropna()
    if train_values.empty or test_values.empty:
        return float("nan")

    try:
        _, quantiles = pd.qcut(train_values, q=bins, retbins=True, duplicates="drop")
    except (ValueError, TypeError, IndexError):
        return float("nan")

    if len(quantiles) < 3:
        return 0.0

    quantiles[0] = -np.inf
    quantiles[-1] = np.inf
    train_bins = pd.cut(train_values, bins=quantiles, include_lowest=True)
    test_bins = pd.cut(test_values, bins=quantiles, include_lowest=True)

    train_pct = train_bins.value_counts(normalize=True, sort=False).values
    test_pct = test_bins.value_counts(normalize=True, sort=False).values
    eps = 1e-6
    train_pct = np.clip(train_pct, eps, 1)
    test_pct = np.clip(test_pct, eps, 1)
    psi = np.sum((test_pct - train_pct) * np.log(test_pct / train_pct))
    return float(psi)


def compute_data_metrics(df: pd.DataFrame, random_state: int) -> Tuple[List[MetricRow], Dict[str, Any]]:
    rows: List[MetricRow] = []

    missing_rates = (df[FEATURE_COLUMNS].isna().sum() / len(df)) * 100
    max_missing = float(missing_rates.max()) if not missing_rates.empty else float("nan")
    rows.append(
        MetricRow(
            "Data",
            "Max missing rate per feature (%)",
            fmt_float(max_missing, 3),
            "<= 1.0",
            classify_low_better(max_missing, 1.0, 5.0),
            "Computed as max(null_count/total_rows*100) across all feature columns.",
        )
    )

    duplicate_rate = float(df.duplicated().mean() * 100)
    rows.append(
        MetricRow(
            "Data",
            "Duplicate row rate (%)",
            fmt_float(duplicate_rate, 3),
            "<= 1.0",
            classify_low_better(duplicate_rate, 1.0, 3.0),
            "Computed as duplicated_rows/total_rows*100.",
        )
    )

    class_counts = df[TARGET_COLUMN].value_counts()
    if len(class_counts) > 1 and class_counts.min() > 0:
        imbalance_ratio = float(class_counts.max() / class_counts.min())
    else:
        imbalance_ratio = float("nan")
    rows.append(
        MetricRow(
            "Data",
            "Class imbalance ratio",
            fmt_float(imbalance_ratio, 4),
            "<= 3.0",
            classify_low_better(imbalance_ratio, 3.0, 10.0),
            "Computed as largest_class_count/smallest_class_count.",
        )
    )

    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].copy()
    idx = np.arange(len(df))
    x_train, x_test, _, _, idx_train, idx_test = train_test_split(
        X,
        y,
        idx,
        test_size=0.2,
        random_state=random_state,
        stratify=y,
    )

    leakage_count = float(len(set(idx_train).intersection(set(idx_test))))
    rows.append(
        MetricRow(
            "Data",
            "Train/Test leakage intersection size",
            str(int(leakage_count)),
            "== 0",
            classify_exact_zero(leakage_count),
            "Computed as |train_indices ∩ test_indices|.",
        )
    )

    psi_values: Dict[str, float] = {}
    for col in FEATURE_COLUMNS:
        psi_values[col] = calc_psi(x_train[col], x_test[col], bins=10)
    valid_psi_values = [v for v in psi_values.values() if not math.isnan(v)]
    psi_max = max(valid_psi_values) if valid_psi_values else float("nan")
    rows.append(
        MetricRow(
            "Data",
            "Max PSI (train vs test)",
            fmt_float(psi_max, 4),
            "< 0.10",
            classify_low_better(psi_max, 0.10, 0.25),
            "PSI computed per feature with quantile bins from train distribution.",
        )
    )

    context = {
        "X_all": X,
        "y_all": y,
        "x_train": x_train,
        "x_test": x_test,
        "y_train": y.loc[x_train.index],
        "y_test": y.loc[x_test.index],
        "psi_values": psi_values,
    }
    return rows, context


def load_model_and_scaler(model_path: Path, scaler_path: Path):
    if keras is None:
        raise RuntimeError("TensorFlow/Keras is not available. Install tensorflow to run model metrics.")
    model = keras.models.load_model(model_path)
    scaler = joblib.load(scaler_path)
    return model, scaler


def compute_model_metrics(
    context: Dict[str, Any],
    model_path: Path,
    scaler_path: Path,
    cv_folds: int,
    random_state: int,
) -> List[MetricRow]:
    rows: List[MetricRow] = []
    model, scaler = load_model_and_scaler(model_path, scaler_path)

    X_all = context["X_all"]
    y_all = context["y_all"].astype(int)
    x_train = context["x_train"]
    x_test = context["x_test"]
    y_train = context["y_train"].astype(int)
    y_test = context["y_test"].astype(int)

    train_scaled = scaler.transform(x_train)
    test_scaled = scaler.transform(x_test)
    all_scaled = scaler.transform(X_all)

    train_prob = model.predict(train_scaled, verbose=0)
    test_prob = model.predict(test_scaled, verbose=0)
    train_pred = np.argmax(train_prob, axis=1)
    test_pred = np.argmax(test_prob, axis=1)

    classes = sorted(y_all.unique().tolist())
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test, test_pred, labels=classes, average=None, zero_division=0
    )
    macro_f1 = f1_score(y_test, test_pred, average="macro", zero_division=0)
    macro_precision = float(np.mean(precision))
    macro_recall = float(np.mean(recall))

    rows.extend(
        [
            MetricRow(
                "Model",
                "Precision (macro)",
                fmt_float(macro_precision, 4),
                ">= 0.90",
                classify_high_better(macro_precision, 0.90, 0.75),
                "Computed from confusion matrix: TP/(TP+FP), averaged across classes.",
            ),
            MetricRow(
                "Model",
                "Recall (macro)",
                fmt_float(macro_recall, 4),
                ">= 0.90",
                classify_high_better(macro_recall, 0.90, 0.75),
                "Computed from confusion matrix: TP/(TP+FN), averaged across classes.",
            ),
            MetricRow(
                "Model",
                "F1 (macro)",
                fmt_float(float(macro_f1), 4),
                ">= 0.90",
                classify_high_better(float(macro_f1), 0.90, 0.75),
                "Computed as harmonic mean of precision and recall, averaged across classes.",
            ),
        ]
    )

    y_test_bin = label_binarize(y_test, classes=classes)
    roc_auc = roc_auc_score(y_test_bin, test_prob, average="macro", multi_class="ovr")
    pr_auc = average_precision_score(y_test_bin, test_prob, average="macro")
    rows.extend(
        [
            MetricRow(
                "Model",
                "ROC-AUC (macro, OVR)",
                fmt_float(float(roc_auc), 4),
                ">= 0.90",
                classify_high_better(float(roc_auc), 0.90, 0.75),
                "Area under ROC computed from class probabilities.",
            ),
            MetricRow(
                "Model",
                "PR-AUC (macro)",
                fmt_float(float(pr_auc), 4),
                ">= 0.90",
                classify_high_better(float(pr_auc), 0.90, 0.75),
                "Area under precision-recall curve computed from class probabilities.",
            ),
        ]
    )

    skf = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=random_state)
    fold_f1_scores: List[float] = []
    for _, val_idx in skf.split(all_scaled, y_all):
        y_val = y_all.iloc[val_idx]
        prob_val = model.predict(all_scaled[val_idx], verbose=0)
        pred_val = np.argmax(prob_val, axis=1)
        fold_f1_scores.append(float(f1_score(y_val, pred_val, average="macro", zero_division=0)))
    cv_std = float(np.std(fold_f1_scores))

    train_f1 = float(f1_score(y_train, train_pred, average="macro", zero_division=0))
    val_f1 = float(f1_score(y_test, test_pred, average="macro", zero_division=0))
    overfit_gap = float(train_f1 - val_f1)

    rows.extend(
        [
            MetricRow(
                "Model",
                "CV stability (std of fold F1)",
                fmt_float(cv_std, 5),
                "<= 0.03",
                classify_low_better(cv_std, 0.03, 0.08),
                f"Computed as std of macro F1 over {cv_folds} stratified folds.",
            ),
            MetricRow(
                "Model",
                "Overfitting gap (train F1 - validation F1)",
                fmt_float(overfit_gap, 5),
                "<= 0.05",
                classify_low_better(overfit_gap, 0.05, 0.15),
                "Computed from train split and holdout validation split.",
            ),
        ]
    )

    return rows


def request_with_timing(
    method: str,
    url: str,
    timeout: float,
    headers: Optional[Dict[str, str]] = None,
    json_payload: Optional[Dict[str, Any]] = None,
) -> Tuple[Optional[requests.Response], float, bool]:
    start = time.perf_counter()
    try:
        response = requests.request(
            method=method,
            url=url,
            timeout=timeout,
            headers=headers,
            json=json_payload,
        )
        elapsed = time.perf_counter() - start
        return response, elapsed, False
    except requests.Timeout:
        elapsed = time.perf_counter() - start
        return None, elapsed, True
    except requests.RequestException:
        elapsed = time.perf_counter() - start
        return None, elapsed, False


def make_predict_payload(df: pd.DataFrame) -> Dict[str, float]:
    medians = df[FEATURE_COLUMNS].median(numeric_only=True).to_dict()
    return {
        "MAP": float(medians["MAP"]),
        "TPS": float(medians["TPS"]),
        "Force": float(medians["Force"]),
        "Power": float(medians["Power"]),
        "RPM": float(medians["RPM"]),
        "Consumption_LH": float(medians["Consumption L/H"]),
        "Consumption_L100KM": float(medians["Consumption L/100KM"]),
        "Speed": float(medians["Speed"]),
        "CO": float(medians["CO"]),
        "HC": float(medians["HC"]),
        "CO2": float(medians["CO2"]),
        "O2": float(medians["O2"]),
        "Lambda": float(medians["Lambda"]),
        "AFR": float(medians["AFR"]),
    }


def compute_api_metrics(
    base_url: str,
    n_requests: int,
    timeout: float,
    payload: Dict[str, float],
) -> List[MetricRow]:
    rows: List[MetricRow] = []

    health_success = 0
    for _ in range(n_requests):
        resp, _, is_timeout = request_with_timing("GET", f"{base_url}/health", timeout=timeout)
        if not is_timeout and resp is not None and 200 <= resp.status_code < 300:
            health_success += 1
    availability = (health_success / n_requests) * 100 if n_requests else float("nan")

    latencies: List[float] = []
    timeout_count = 0
    error_5xx = 0
    total = 0
    for _ in range(n_requests):
        resp, elapsed, is_timeout = request_with_timing(
            "POST",
            f"{base_url}/predict",
            timeout=timeout,
            json_payload=payload,
        )
        total += 1
        if is_timeout:
            timeout_count += 1
            continue
        if resp is None:
            continue
        latencies.append(elapsed)
        if 500 <= resp.status_code <= 599:
            error_5xx += 1

    p95 = percentile(latencies, 95)
    p99 = percentile(latencies, 99)
    error_5xx_rate = (error_5xx / total) * 100 if total else float("nan")
    timeout_rate = (timeout_count / total) * 100 if total else float("nan")

    rows.extend(
        [
            MetricRow(
                "API",
                "Predict latency P95 (seconds)",
                fmt_float(p95, 4),
                "<= 0.30",
                classify_low_better(p95, 0.30, 0.80),
                "Computed from POST /predict response times.",
            ),
            MetricRow(
                "API",
                "Predict latency P99 (seconds)",
                fmt_float(p99, 4),
                "<= 0.60",
                classify_low_better(p99, 0.60, 1.50),
                "Computed from POST /predict response times.",
            ),
            MetricRow(
                "API",
                "HTTP 5xx error rate (%)",
                fmt_float(error_5xx_rate, 3),
                "<= 1.0",
                classify_low_better(error_5xx_rate, 1.0, 5.0),
                "Computed as 5xx_count/total_requests*100 on /predict.",
            ),
            MetricRow(
                "API",
                "Timeout rate (%)",
                fmt_float(timeout_rate, 3),
                "<= 1.0",
                classify_low_better(timeout_rate, 1.0, 5.0),
                "Computed as timeout_count/total_requests*100 on /predict.",
            ),
            MetricRow(
                "API",
                "Availability (%)",
                fmt_float(availability, 3),
                ">= 99.0",
                classify_high_better(availability, 99.0, 95.0),
                "Computed as successful /health probes over total probes.",
            ),
        ]
    )
    return rows


def make_backend_payload(df: pd.DataFrame) -> Dict[str, float]:
    medians = df[FEATURE_COLUMNS].median(numeric_only=True).to_dict()
    return {
        "map": float(medians["MAP"]),
        "tps": float(medians["TPS"]),
        "force": float(medians["Force"]),
        "power": float(medians["Power"]),
        "rpm": float(medians["RPM"]),
        "consumptionLH": float(medians["Consumption L/H"]),
        "consumptionL100km": float(medians["Consumption L/100KM"]),
        "speed": float(medians["Speed"]),
        "co": float(medians["CO"]),
        "hc": float(medians["HC"]),
        "co2": float(medians["CO2"]),
        "o2": float(medians["O2"]),
        "lambda": float(medians["Lambda"]),
        "afr": float(medians["AFR"]),
    }


def compute_backend_metrics(
    base_url: str,
    booking_id: int,
    token: str,
    n_requests: int,
    timeout: float,
    payload: Dict[str, float],
) -> List[MetricRow]:
    rows: List[MetricRow] = []
    headers = {"Authorization": f"Bearer {token}"}
    post_latencies: List[float] = []
    get_latencies: List[float] = []
    success_count = 0
    ml_failures = 0
    total = 0

    endpoint = f"{base_url}/api/diagnostic/booking/{booking_id}"

    for _ in range(n_requests):
        resp, elapsed, _ = request_with_timing(
            "POST", endpoint, timeout=timeout, headers=headers, json_payload=payload
        )
        total += 1
        if resp is not None:
            post_latencies.append(elapsed)
            message = ""
            try:
                payload_json = resp.json()
                if isinstance(payload_json, dict):
                    message = str(payload_json.get("message", ""))
            except (ValueError, TypeError):
                message = ""
            if resp.status_code == 400 and "ML prediction failed" in message:
                ml_failures += 1
            if 200 <= resp.status_code < 300:
                success_count += 1

        resp_g, elapsed_g, _ = request_with_timing("GET", endpoint, timeout=timeout, headers=headers)
        if resp_g is not None and 200 <= resp_g.status_code < 300:
            get_latencies.append(elapsed_g)

    success_rate = (success_count / total) * 100 if total else float("nan")
    ml_failure_rate = (ml_failures / total) * 100 if total else float("nan")
    post_p95 = percentile(post_latencies, 95)
    get_p95 = percentile(get_latencies, 95)

    rows.extend(
        [
            MetricRow(
                "Backend",
                "E2E success rate (%)",
                fmt_float(success_rate, 3),
                ">= 99.0",
                classify_high_better(success_rate, 99.0, 95.0),
                "Computed as 2xx POST responses / total diagnostic POST requests.",
            ),
            MetricRow(
                "Backend",
                "ML failure rate (%)",
                fmt_float(ml_failure_rate, 3),
                "<= 1.0",
                classify_low_better(ml_failure_rate, 1.0, 5.0),
                "Proxy from backend responses containing 'ML prediction failed'.",
            ),
            MetricRow(
                "Backend",
                "DB write path latency P95 (seconds)",
                fmt_float(post_p95, 4),
                "<= 0.50",
                classify_low_better(post_p95, 0.50, 1.50),
                "P95 latency for POST /api/diagnostic/booking/{bookingId}.",
            ),
            MetricRow(
                "Backend",
                "DB read path latency P95 (seconds)",
                fmt_float(get_p95, 4),
                "<= 0.50",
                classify_low_better(get_p95, 0.50, 1.50),
                "P95 latency for GET /api/diagnostic/booking/{bookingId}.",
            ),
        ]
    )
    return rows


def compute_system_metrics(system_metrics_csv: Path) -> List[MetricRow]:
    rows: List[MetricRow] = []
    sdf = pd.read_csv(system_metrics_csv)
    expected = {"timestamp", "cpu_percent", "memory_mb"}
    if not expected.issubset(set(sdf.columns)):
        raise ValueError(
            f"{system_metrics_csv} must contain at least columns: {sorted(expected)}"
        )

    cpu_avg = float(sdf["cpu_percent"].mean())
    mem_avg = float(sdf["memory_mb"].mean())

    ts = pd.to_datetime(sdf["timestamp"], errors="coerce")
    valid = ts.notna()
    leak_per_hour = float("nan")
    if valid.sum() >= 2:
        t0 = ts[valid].iloc[0]
        t1 = ts[valid].iloc[-1]
        dt_hours = (t1 - t0).total_seconds() / 3600.0
        if dt_hours > 0:
            m0 = float(sdf.loc[valid, "memory_mb"].iloc[0])
            m1 = float(sdf.loc[valid, "memory_mb"].iloc[-1])
            leak_per_hour = (m1 - m0) / dt_hours

    rows.extend(
        [
            MetricRow(
                "Backend",
                "CPU average (%)",
                fmt_float(cpu_avg, 3),
                "<= 70.0",
                classify_low_better(cpu_avg, 70.0, 85.0),
                "Computed as average CPU percent over monitoring window.",
            ),
            MetricRow(
                "Backend",
                "Memory average (MB)",
                fmt_float(mem_avg, 3),
                "Context-based",
                "INFO",
                "Average memory usage over monitoring window.",
            ),
            MetricRow(
                "Backend",
                "Memory leak trend (MB/hour)",
                fmt_float(leak_per_hour, 3),
                "<= 50.0",
                classify_low_better(leak_per_hour, 50.0, 200.0),
                "Computed as (last_memory-first_memory)/elapsed_hours.",
            ),
        ]
    )

    if {"queue_jobs_total", "queue_jobs_failed"}.issubset(set(sdf.columns)):
        total_jobs = float(sdf["queue_jobs_total"].max())
        failed_jobs = float(sdf["queue_jobs_failed"].max())
        queue_failure_rate = (failed_jobs / total_jobs) * 100 if total_jobs > 0 else float("nan")
        rows.append(
            MetricRow(
                "Backend",
                "Queue/job failure rate (%)",
                fmt_float(queue_failure_rate, 3),
                "<= 1.0",
                classify_low_better(queue_failure_rate, 1.0, 5.0),
                "Computed as queue_jobs_failed/queue_jobs_total*100.",
            )
        )
    else:
        rows.append(
            MetricRow(
                "Backend",
                "Queue/job failure rate (%)",
                "N/A",
                "<= 1.0",
                "SKIPPED",
                "Not computed (queue_jobs_total and queue_jobs_failed columns not provided).",
            )
        )
    return rows


def write_outputs(rows: List[MetricRow], output_csv: Path, output_md: Path) -> None:
    out_df = pd.DataFrame([r.__dict__ for r in rows])
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    output_md.parent.mkdir(parents=True, exist_ok=True)
    out_df.to_csv(output_csv, index=False)

    with output_md.open("w", encoding="utf-8") as f:
        f.write("# Evaluation Sheet\n\n")
        f.write("| Layer | Metric | Value | Target | Status | Details |\n")
        f.write("|---|---|---:|---:|---|---|\n")
        for r in rows:
            details = r.details.replace("\n", " ").replace("|", "&#124;")
            f.write(
                f"| {r.layer} | {r.metric} | {r.value} | {r.target} | {r.status} | {details} |\n"
            )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate Data/Model/API/Backend metrics.")
    parser.add_argument(
        "--data-csv",
        default="data/EngineFaultDB_Final.csv",
        help="Path to dataset CSV",
    )
    parser.add_argument(
        "--model-path",
        default="models/engine_fault_nn_model.keras",
        help="Path to trained Keras model",
    )
    parser.add_argument(
        "--scaler-path",
        default="models/feature_scaler.pkl",
        help="Path to fitted feature scaler",
    )
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--cv-folds", type=int, default=5)

    parser.add_argument("--run-api", action="store_true", help="Run FastAPI runtime probes")
    parser.add_argument("--api-base-url", default="http://localhost:8001")
    parser.add_argument("--api-requests", type=int, default=30)
    parser.add_argument("--api-timeout", type=float, default=3.0)

    parser.add_argument("--run-backend", action="store_true", help="Run backend runtime probes")
    parser.add_argument("--backend-base-url", default="http://localhost:8080")
    parser.add_argument("--backend-booking-id", type=int, default=None)
    parser.add_argument("--backend-token", default=None)
    parser.add_argument("--backend-requests", type=int, default=30)
    parser.add_argument("--backend-timeout", type=float, default=5.0)

    parser.add_argument(
        "--system-metrics-csv",
        default=None,
        help="Optional system metrics CSV with timestamp,cpu_percent,memory_mb and optional queue columns.",
    )
    parser.add_argument(
        "--output-csv",
        default="tests/evaluation_sheet.csv",
        help="Output CSV path for consolidated metrics",
    )
    parser.add_argument(
        "--output-md",
        default="tests/evaluation_sheet.md",
        help="Output Markdown path for consolidated metrics",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    data_csv = Path(args.data_csv)
    model_path = Path(args.model_path)
    scaler_path = Path(args.scaler_path)
    output_csv = Path(args.output_csv)
    output_md = Path(args.output_md)

    if not data_csv.exists():
        print(f"ERROR: Data CSV not found: {data_csv}", file=sys.stderr)
        return 2

    rows: List[MetricRow] = []
    df = pd.read_csv(data_csv)
    data_rows, context = compute_data_metrics(df, random_state=args.random_state)
    rows.extend(data_rows)

    if model_path.exists() and scaler_path.exists():
        try:
            rows.extend(
                compute_model_metrics(
                    context=context,
                    model_path=model_path,
                    scaler_path=scaler_path,
                    cv_folds=args.cv_folds,
                    random_state=args.random_state,
                )
            )
        except (RuntimeError, FileNotFoundError, ValueError, ImportError, AttributeError, OSError) as e:
            rows.append(
                MetricRow(
                    "Model",
                    "Model metrics execution",
                    "N/A",
                    "Model/scaler load + inference",
                    "SKIPPED",
                    f"Skipped model metrics due to: {e}",
                )
            )
    else:
        rows.append(
            MetricRow(
                "Model",
                "Model metrics execution",
                "N/A",
                "Model/scaler present",
                "SKIPPED",
                "Skipped model metrics because model or scaler file is missing.",
            )
        )

    if args.run_api:
        rows.extend(
            compute_api_metrics(
                base_url=args.api_base_url,
                n_requests=args.api_requests,
                timeout=args.api_timeout,
                payload=make_predict_payload(df),
            )
        )
    else:
        rows.append(
            MetricRow(
                "API",
                "API runtime metrics",
                "N/A",
                "Run with --run-api",
                "SKIPPED",
                "API checks were skipped; start FastAPI and rerun with --run-api.",
            )
        )

    if args.run_backend:
        if not args.backend_token or args.backend_booking_id is None:
            rows.append(
                MetricRow(
                    "Backend",
                    "Backend runtime metrics",
                    "N/A",
                    "Provide --backend-token and --backend-booking-id",
                    "SKIPPED",
                    "Backend checks were requested but required auth/booking args are missing.",
                )
            )
        else:
            rows.extend(
                compute_backend_metrics(
                    base_url=args.backend_base_url,
                    booking_id=args.backend_booking_id,
                    token=args.backend_token,
                    n_requests=args.backend_requests,
                    timeout=args.backend_timeout,
                    payload=make_backend_payload(df),
                )
            )
    else:
        rows.append(
            MetricRow(
                "Backend",
                "Backend runtime metrics",
                "N/A",
                "Run with --run-backend",
                "SKIPPED",
                "Backend checks were skipped; start backend and rerun with --run-backend.",
            )
        )

    if args.system_metrics_csv:
        try:
            rows.extend(compute_system_metrics(Path(args.system_metrics_csv)))
        except (ValueError, FileNotFoundError, pd.errors.ParserError) as e:
            rows.append(
                MetricRow(
                    "Backend",
                    "System resource metrics",
                    "N/A",
                    "Valid system CSV",
                    "SKIPPED",
                    f"System metrics skipped due to: {e}",
                )
            )
    else:
        rows.append(
            MetricRow(
                "Backend",
                "System resource metrics",
                "N/A",
                "Provide --system-metrics-csv",
                "SKIPPED",
                "CPU/memory/queue metrics skipped (no system metrics CSV provided).",
            )
        )

    write_outputs(rows, output_csv=output_csv, output_md=output_md)
    print(f"Evaluation sheet written to: {output_csv}")
    print(f"Evaluation sheet written to: {output_md}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
