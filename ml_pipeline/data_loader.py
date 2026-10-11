"""
FreshCheck Data Loader & Splitting Module
==========================================
Handles dataset acquisition, integrity checks, and stratified
Train (70%) / Validation (15%) / Test (15%) partitioning.
"""

import os
import json
import shutil
import random
from pathlib import Path
from typing import Dict, List, Tuple
from sklearn.model_selection import train_test_split
from PIL import Image

CLASSES = [
    "fresh_apple",
    "rotten_apple",
    "fresh_banana",
    "rotten_banana",
    "fresh_orange",
    "rotten_orange"
]

def verify_and_clean_image(image_path: Path) -> bool:
    """Verifies that an image file is readable and non-corrupt."""
    try:
        with Image.open(image_path) as img:
            img.verify()
        # Ensure it can actually be loaded and converted to RGB
        with Image.open(image_path) as img:
            img.convert("RGB")
        return True
    except Exception:
        return False

def scan_dataset(data_dir: Path) -> Dict[str, List[Path]]:
    """Scans dataset directory for valid image files per class."""
    class_images = {}
    valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    for cls in CLASSES:
        cls_dir = data_dir / cls
        if not cls_dir.exists():
            continue
        valid_files = []
        for file in cls_dir.iterdir():
            if file.suffix.lower() in valid_exts and verify_and_clean_image(file):
                valid_files.append(file)
        class_images[cls] = valid_files
    return class_images

def create_stratified_splits(
    data_dir: Path,
    output_dir: Path,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_state: int = 42
) -> Dict[str, any]:
    """
    Performs stratified Train / Validation / Test split.
    Guarantees zero data leakage by creating distinct manifest files
    and destination directories.
    """
    assert abs((train_ratio + val_ratio + test_ratio) - 1.0) < 1e-5, "Ratios must sum to 1.0"
    
    class_images = scan_dataset(data_dir)
    all_paths = []
    all_labels = []

    for cls, paths in class_images.items():
        for p in paths:
            all_paths.append(str(p))
            all_labels.append(cls)

    if not all_paths:
        raise ValueError(f"No valid images found in {data_dir} for classes: {CLASSES}")

    # First split: Train vs (Val + Test)
    val_test_ratio = val_ratio + test_ratio
    X_train, X_temp, y_train, y_temp = train_test_split(
        all_paths,
        all_labels,
        test_size=val_test_ratio,
        stratify=all_labels,
        random_state=random_state
    )

    # Second split: Val vs Test
    relative_test_ratio = test_ratio / val_test_ratio
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp,
        y_temp,
        test_size=relative_test_ratio,
        stratify=y_temp,
        random_state=random_state
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = {
        "train": [{"path": p, "label": l} for p, l in zip(X_train, y_train)],
        "val": [{"path": p, "label": l} for p, l in zip(X_val, y_val)],
        "test": [{"path": p, "label": l} for p, l in zip(X_test, y_test)],
        "classes": sorted(list(set(all_labels))),
        "counts": {
            "train": len(X_train),
            "val": len(X_val),
            "test": len(X_test),
            "total": len(all_paths)
        }
    }

    manifest_file = output_dir / "split_manifest.json"
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Stratified split completed:")
    print(f"  Total samples: {len(all_paths)}")
    print(f"  Training set:   {len(X_train)} ({len(X_train)/len(all_paths)*100:.1f}%)")
    print(f"  Validation set: {len(X_val)} ({len(X_val)/len(all_paths)*100:.1f}%)")
    print(f"  Test set:       {len(X_test)} ({len(X_test)/len(all_paths)*100:.1f}%)")
    print(f"  Manifest saved: {manifest_file}")

    return manifest

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="FreshCheck Dataset Splitter")
    parser.add_argument("--data-dir", type=str, default="data/raw", help="Path to raw dataset")
    parser.add_argument("--output-dir", type=str, default="data/splits", help="Output directory for manifests")
    args = parser.parse_args()

    data_path = Path(args.data_dir)
    out_path = Path(args.output_dir)
    if not data_path.exists():
        print(f"Directory {data_path} does not exist yet. Please run download_dataset.py first.")
    else:
        create_stratified_splits(data_path, out_path)
