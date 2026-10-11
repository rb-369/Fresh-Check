"""
FreshCheck 100% Real Dataset Ingestion Pipeline
===============================================
Extracts authentic, high-resolution agricultural photographs of produce from
Project-AgML/fresh_rotten_fruit_classification (Mendeley Data / AgriVision):
- Real Fresh Apples (Shard 0)
- Real Fresh Bananas (Shard 0)
- Real Fresh Oranges (Shard 1)
- Real Rotten Apples (Shard 2)
- Real Rotten Bananas (Shard 2)
- Real Rotten Oranges (Shard 3)

Every single image is 100% genuine real-world produce photo (no synthetic shapes).
"""

import io
import os
import glob
import json
import shutil
from pathlib import Path
from PIL import Image
import pyarrow.parquet as pq

CLASSES = [
    "fresh_apple",
    "rotten_apple",
    "fresh_banana",
    "rotten_banana",
    "fresh_orange",
    "rotten_orange"
]

def clean_raw_dirs(data_raw_dir: Path):
    """Cleans raw directories."""
    print(f"Cleaning raw directories in {data_raw_dir}...")
    for cls in CLASSES:
        cls_dir = data_raw_dir / cls
        if cls_dir.exists():
            shutil.rmtree(cls_dir)
        cls_dir.mkdir(parents=True, exist_ok=True)

def extract_class_images(shard_path: Path, target_fruit: str, target_label: int, out_dir: Path, target_count: int = 60):
    """Extracts genuine photographs from a Parquet shard for a specific fruit and label."""
    if not shard_path.exists():
        print(f"  [!] Shard missing: {shard_path}")
        return 0

    print(f"  Reading {shard_path.name} for {target_fruit} (label={target_label})...")
    table = pq.read_table(str(shard_path))
    fruits = table["fruit_type"].to_pylist()
    labels = table["label"].to_pylist()
    images = table["image"]

    saved = 0
    prefix = "fresh" if target_label == 0 else "rotten"
    for idx in range(len(fruits)):
        if fruits[idx] == target_fruit and labels[idx] == target_label and saved < target_count:
            save_file = out_dir / f"real_{prefix}_{target_fruit}_{saved+1:03d}.jpg"
            try:
                raw_bytes = images[idx].as_py()["bytes"]
                img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
                img.thumbnail((640, 640), Image.Resampling.LANCZOS)
                img.save(save_file, "JPEG", quality=92)
                saved += 1
            except Exception as e:
                pass

    print(f"  [+] Saved {saved} real photos to {out_dir.name}")
    return saved

def update_samples_gallery(data_raw_dir: Path, samples_dir: Path):
    """Updates the frontend sample gallery with real photos."""
    print(f"\nUpdating 1-click test gallery in {samples_dir} with real produce photos...")
    samples_dir.mkdir(parents=True, exist_ok=True)
    manifest = []

    for cls in CLASSES:
        cls_dir = data_raw_dir / cls
        real_files = sorted(list(cls_dir.glob("*.jpg")))
        if not real_files:
            continue
        # Take 2 representative photos per class
        for idx in range(min(2, len(real_files))):
            src_file = real_files[idx]
            dest_name = f"sample_{cls}_{idx+1}.jpg"
            dest_path = samples_dir / dest_name
            shutil.copyfile(src_file, dest_path)

            manifest.append({
                "id": f"{cls}_{idx+1}",
                "filename": dest_name,
                "label": cls,
                "displayName": cls.replace("_", " ").title(),
                "category": "fresh" if "fresh" in cls else "rotten"
            })

    with open(samples_dir / "samples.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"  Saved {len(manifest)} authentic real sample images to gallery.")

def run_real_dataset_ingestion(target_per_class: int = 60):
    raw_dir = Path("data/raw")
    samples_dir = Path("backend/app/samples")

    snap_pattern = os.path.expanduser("~/.cache/huggingface/hub/datasets--Project-AgML--fresh_rotten_fruit_classification/snapshots/*")
    snapshots = glob.glob(snap_pattern)
    if not snapshots:
        raise RuntimeError("AgML dataset snapshot directory not found in cache.")

    snap_dir = Path(snapshots[0]) / "raw"
    shard0 = snap_dir / "train-00000-of-00004.parquet"
    shard1 = snap_dir / "train-00001-of-00004.parquet"
    shard2 = snap_dir / "train-00002-of-00004.parquet"
    shard3 = snap_dir / "train-00003-of-00004.parquet"

    clean_raw_dirs(raw_dir)

    print("\n--- Extracting 100% Genuine Produce Images ---")
    extract_class_images(shard0, "apple", 0, raw_dir / "fresh_apple", target_per_class)
    extract_class_images(shard2, "apple", 1, raw_dir / "rotten_apple", target_per_class)
    extract_class_images(shard0, "banana", 0, raw_dir / "fresh_banana", target_per_class)
    extract_class_images(shard2, "banana", 1, raw_dir / "rotten_banana", target_per_class)
    extract_class_images(shard1, "orange", 0, raw_dir / "fresh_orange", target_per_class)
    extract_class_images(shard3, "orange", 1, raw_dir / "rotten_orange", target_per_class)

    update_samples_gallery(raw_dir, samples_dir)

    print("\n================ REAL DATASET READY ================")
    total = 0
    for cls in CLASSES:
        c = len(list((raw_dir / cls).glob("*.jpg")))
        total += c
        print(f"  {cls:<15}: {c} genuine photographs")
    print(f"Total Authentic Images: {total}")

if __name__ == "__main__":
    run_real_dataset_ingestion(target_per_class=60)
