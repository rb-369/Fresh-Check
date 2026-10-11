"""
FreshCheck Model Training & Validation Tuning Module
====================================================
Trains the primary Random Forest Classifier with validation tuning,
alongside Decision Tree and SVM baselines for college viva comparative study.
"""

import os
import json
import joblib
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score

def load_data(processed_dir: Path):
    """Loads feature matrices and class labels."""
    X_train = np.load(processed_dir / "X_train.npy")
    y_train = np.load(processed_dir / "y_train.npy")
    X_val = np.load(processed_dir / "X_val.npy")
    y_val = np.load(processed_dir / "y_val.npy")

    with open(processed_dir / "classes.json", "r", encoding="utf-8") as f:
        class_info = json.load(f)

    return X_train, y_train, X_val, y_val, class_info

def train_and_tune_random_forest(X_train, y_train, X_val, y_val):
    """
    Tuning Random Forest on Validation set to select optimal hyperparameters
    without touching the final test set.
    """
    print("\n--- Tuning Random Forest Hyperparameters on Validation Set ---")
    param_grid = [
        {"n_estimators": 50, "max_depth": 10, "min_samples_split": 2},
        {"n_estimators": 100, "max_depth": 15, "min_samples_split": 2},
        {"n_estimators": 100, "max_depth": None, "min_samples_split": 2},
        {"n_estimators": 150, "max_depth": None, "min_samples_split": 2},
        {"n_estimators": 100, "max_depth": None, "min_samples_split": 5},
    ]

    best_score = -1.0
    best_params = None
    best_rf = None
    tuning_log = []

    for params in param_grid:
        rf = RandomForestClassifier(
            n_estimators=params["n_estimators"],
            max_depth=params["max_depth"],
            min_samples_split=params["min_samples_split"],
            random_state=42,
            n_jobs=-1
        )
        rf.fit(X_train, y_train)
        val_preds = rf.predict(X_val)
        val_acc = accuracy_score(y_val, val_preds)

        print(f"  Params: {params} => Validation Accuracy: {val_acc:.4f}")
        tuning_log.append({
            "params": params,
            "val_accuracy": float(val_acc)
        })

        if val_acc > best_score:
            best_score = val_acc
            best_params = params
            best_rf = rf

    print(f"Optimal RF Parameters: {best_params} with Validation Accuracy: {best_score:.4f}")
    return best_rf, best_params, tuning_log

def train_baselines(X_train, y_train, X_val, y_val):
    """Trains Decision Tree and SVM baselines on training features."""
    print("\n--- Training Baseline Classifiers ---")
    
    # 1. Decision Tree Baseline
    dt = DecisionTreeClassifier(random_state=42)
    dt.fit(X_train, y_train)
    dt_val_acc = accuracy_score(y_val, dt.predict(X_val))
    print(f"  Decision Tree (Default) => Validation Accuracy: {dt_val_acc:.4f}")

    # 2. Support Vector Machine (RBF kernel with probability estimates)
    svm = SVC(kernel="rbf", probability=True, C=1.0, random_state=42)
    svm.fit(X_train, y_train)
    svm_val_acc = accuracy_score(y_val, svm.predict(X_val))
    print(f"  Support Vector Machine (RBF) => Validation Accuracy: {svm_val_acc:.4f}")

    return dt, svm

def run_training_pipeline(processed_dir: Path, models_dir: Path):
    """Executes full model fitting stage and saves trained estimators."""
    models_dir.mkdir(parents=True, exist_ok=True)
    X_train, y_train, X_val, y_val, class_info = load_data(processed_dir)

    print(f"Loaded training data: {X_train.shape[0]} samples, {X_train.shape[1]} features.")
    print(f"Loaded validation data: {X_val.shape[0]} samples.")

    # Train primary RF
    best_rf, best_params, tuning_log = train_and_tune_random_forest(X_train, y_train, X_val, y_val)

    # Train baselines
    dt_model, svm_model = train_baselines(X_train, y_train, X_val, y_val)

    # Save models
    joblib.dump(best_rf, models_dir / "freshcheck_rf.joblib")
    joblib.dump(dt_model, models_dir / "baseline_dt.joblib")
    joblib.dump(svm_model, models_dir / "baseline_svm.joblib")

    # Save metadata
    metadata = {
        "best_rf_params": best_params,
        "tuning_log": tuning_log,
        "feature_dim": X_train.shape[1],
        "classes": class_info["classes"],
        "class_to_idx": class_info["class_to_idx"]
    }
    with open(models_dir / "training_meta.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nAll models saved to {models_dir}:")
    print(f"  - freshcheck_rf.joblib (Primary Random Forest)")
    print(f"  - baseline_dt.joblib (Decision Tree)")
    print(f"  - baseline_svm.joblib (Support Vector Machine)")
    print(f"  - training_meta.json")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="FreshCheck Model Trainer")
    parser.add_argument("--processed-dir", type=str, default="data/processed")
    parser.add_argument("--models-dir", type=str, default="models")
    args = parser.parse_args()

    run_training_pipeline(Path(args.processed_dir), Path(args.models_dir))
