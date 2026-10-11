"""
FreshCheck Evaluation Module
============================
Performs rigorous, un-biased final evaluation strictly on the unseen test split.
Calculates actual empirical metrics: Accuracy, Precision, Recall, F1-Score,
Confusion Matrix, and comparative benchmarks (Random Forest vs Decision Tree vs SVM).
Saves metrics.json which drives the live React analytics dashboard.
"""

import os
import json
import joblib
import numpy as np
from pathlib import Path
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server/script plotting
import matplotlib.pyplot as plt
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

def evaluate_test_set(processed_dir: Path, models_dir: Path):
    """Evaluates all trained classifiers on the test split and outputs verified metrics."""
    X_test = np.load(processed_dir / "X_test.npy")
    y_test = np.load(processed_dir / "y_test.npy")

    with open(processed_dir / "classes.json", "r", encoding="utf-8") as f:
        class_info = json.load(f)

    classes = class_info["classes"]
    print(f"Loaded held-out test split: {X_test.shape[0]} samples across {len(classes)} classes.")

    # Load models
    rf_model = joblib.load(models_dir / "freshcheck_rf.joblib")
    dt_model = joblib.load(models_dir / "baseline_dt.joblib")
    svm_model = joblib.load(models_dir / "baseline_svm.joblib")

    # Predict on test split
    rf_preds = rf_model.predict(X_test)
    dt_preds = dt_model.predict(X_test)
    svm_preds = svm_model.predict(X_test)

    # 1. Primary Model (Random Forest) Metrics
    rf_acc = float(accuracy_score(y_test, rf_preds))
    rf_prec_macro = float(precision_score(y_test, rf_preds, average="macro", zero_division=0))
    rf_rec_macro = float(recall_score(y_test, rf_preds, average="macro", zero_division=0))
    rf_f1_macro = float(f1_score(y_test, rf_preds, average="macro", zero_division=0))
    rf_f1_weighted = float(f1_score(y_test, rf_preds, average="weighted", zero_division=0))

    # Per-class metrics
    clf_rep = classification_report(y_test, rf_preds, target_names=classes, output_dict=True, zero_division=0)
    per_class_metrics = {}
    for c in classes:
        if c in clf_rep:
            per_class_metrics[c] = {
                "precision": float(clf_rep[c]["precision"]),
                "recall": float(clf_rep[c]["recall"]),
                "f1_score": float(clf_rep[c]["f1-score"]),
                "support": int(clf_rep[c]["support"])
            }

    # Confusion Matrix
    cm = confusion_matrix(y_test, rf_preds)
    cm_norm = confusion_matrix(y_test, rf_preds, normalize="true")

    # 2. Baseline Models Comparison
    dt_acc = float(accuracy_score(y_test, dt_preds))
    dt_f1_macro = float(f1_score(y_test, dt_preds, average="macro", zero_division=0))

    svm_acc = float(accuracy_score(y_test, svm_preds))
    svm_f1_macro = float(f1_score(y_test, svm_preds, average="macro", zero_division=0))

    comparison = [
        {
            "model_name": "Random Forest (Ensemble)",
            "test_accuracy": rf_acc,
            "macro_f1": rf_f1_macro,
            "weighted_f1": rf_f1_weighted,
            "type": "Primary (Tuned Ensemble)"
        },
        {
            "model_name": "Support Vector Machine (RBF)",
            "test_accuracy": svm_acc,
            "macro_f1": svm_f1_macro,
            "weighted_f1": float(f1_score(y_test, svm_preds, average="weighted", zero_division=0)),
            "type": "Baseline (Kernelized Linear)"
        },
        {
            "model_name": "Decision Tree (Single)",
            "test_accuracy": dt_acc,
            "macro_f1": dt_f1_macro,
            "weighted_f1": float(f1_score(y_test, dt_preds, average="weighted", zero_division=0)),
            "type": "Baseline (Single Estimator)"
        }
    ]

    # Assemble complete empirical metrics package
    metrics_package = {
        "dataset_summary": {
            "test_sample_count": int(len(y_test)),
            "num_classes": len(classes),
            "classes": classes,
            "feature_representation": "MobileNetV2 (1280-D Embeddings)"
        },
        "primary_model": {
            "name": "Random Forest Classifier",
            "test_accuracy": rf_acc,
            "precision_macro": rf_prec_macro,
            "recall_macro": rf_rec_macro,
            "f1_macro": rf_f1_macro,
            "f1_weighted": rf_f1_weighted,
            "per_class": per_class_metrics
        },
        "confusion_matrix": {
            "classes": classes,
            "raw_matrix": cm.tolist(),
            "normalized_matrix": [[round(float(v), 4) for v in row] for row in cm_norm]
        },
        "model_comparison": comparison
    }

    # Save to metrics.json
    output_json = models_dir / "metrics.json"
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(metrics_package, f, indent=2)

    # Generate Confusion Matrix Chart
    plot_confusion_matrix(cm, classes, models_dir / "confusion_matrix.png", rf_acc)

    print("\n================ FINAL TEST EVALUATION RESULTS ================")
    print(f"Test Accuracy: {rf_acc * 100:.2f}%")
    print(f"Macro F1-Score: {rf_f1_macro:.4f}")
    print("\nModel Comparison Table:")
    for comp in comparison:
        print(f"  {comp['model_name']:<30} | Test Acc: {comp['test_accuracy']*100:.2f}% | F1: {comp['macro_f1']:.4f}")
    print(f"\nEmpirical metrics saved to: {output_json}")

    return metrics_package

def plot_confusion_matrix(cm: np.ndarray, classes: list, save_path: Path, acc: float):
    """Plots and saves confusion matrix heatmap."""
    plt.figure(figsize=(8, 6))
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Greens)
    plt.title(f"FreshCheck Random Forest Confusion Matrix\n(Test Set Accuracy: {acc*100:.2f}%)", fontsize=12, pad=12)
    plt.colorbar()

    tick_marks = np.arange(len(classes))
    clean_labels = [c.replace("_", " ").title() for c in classes]
    plt.xticks(tick_marks, clean_labels, rotation=40, ha="right", fontsize=9)
    plt.yticks(tick_marks, clean_labels, fontsize=9)

    # Annotate numbers in cells
    thresh = cm.max() / 2.0 if cm.max() > 0 else 1.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            val = cm[i, j]
            plt.text(j, i, format(val, "d"),
                     horizontalalignment="center",
                     color="white" if val > thresh else "black",
                     fontsize=10, weight="bold")

    plt.ylabel("True Class", fontsize=11, labelpad=8)
    plt.xlabel("Predicted Class", fontsize=11, labelpad=8)
    plt.tight_layout()
    plt.savefig(save_path, dpi=200)
    plt.close()
    print(f"Confusion matrix plot saved: {save_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Evaluate FreshCheck Models on Test Set")
    parser.add_argument("--processed-dir", type=str, default="data/processed")
    parser.add_argument("--models-dir", type=str, default="models")
    args = parser.parse_args()

    evaluate_test_set(Path(args.processed_dir), Path(args.models_dir))
