"""
FreshCheck Feature Extractor
============================
Extracts dense 1280-dimensional tabular embeddings from produce images
using a pretrained MobileNetV2 backbone (classification head removed).
Transforms spatial pixel arrays into structured features ready for
Random Forest, Decision Tree, and SVM.
"""

import os
import json
import torch
import numpy as np
from pathlib import Path
from typing import List, Tuple, Dict
from PIL import Image
import torchvision.transforms as transforms
import torchvision.models as models

# Device configuration (CPU is standard & fast for MobileNetV2 feature extraction)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ImageNet standard preprocessing pipeline
TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

class MobileNetFeatureExtractor:
    def __init__(self):
        print(f"Loading MobileNetV2 backbone on {DEVICE}...")
        weights = models.MobileNet_V2_Weights.DEFAULT
        base_model = models.mobilenet_v2(weights=weights)
        base_model.eval()

        # Remove top classifier layer so model outputs 1280-D pooled feature vector
        base_model.classifier = torch.nn.Identity()
        for param in base_model.parameters():
            param.requires_grad = False

        self.model = base_model.to(DEVICE)
        self.transform = TRANSFORM
        print("MobileNetV2 feature extractor ready (output dimension: 1280).")

    def extract_single(self, image: Image.Image) -> np.ndarray:
        """Extracts 1280-D feature vector from a single PIL image."""
        if image.mode != "RGB":
            image = image.convert("RGB")
        tensor = self.transform(image).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            features = self.model(tensor)
        return features.cpu().numpy().squeeze(0)  # Shape: (1280,)

    def extract_batch(self, image_paths: List[str], batch_size: int = 32) -> np.ndarray:
        """Extracts features for a list of image paths in mini-batches."""
        all_features = []
        total = len(image_paths)

        for i in range(0, total, batch_size):
            batch_paths = image_paths[i:i + batch_size]
            batch_tensors = []
            valid_indices = []

            for idx, p in enumerate(batch_paths):
                try:
                    with Image.open(p) as img:
                        img_rgb = img.convert("RGB")
                        t = self.transform(img_rgb)
                        batch_tensors.append(t)
                        valid_indices.append(idx)
                except Exception as e:
                    print(f"Warning: Failed to load {p}: {e}")

            if not batch_tensors:
                continue

            stacked = torch.stack(batch_tensors).to(DEVICE)
            with torch.no_grad():
                feats = self.model(stacked).cpu().numpy()
            all_features.append(feats)

            done = min(i + batch_size, total)
            if done % 100 == 0 or done == total:
                print(f"  Extracted {done}/{total} images...")

        if not all_features:
            return np.empty((0, 1280))
        return np.vstack(all_features)


def process_splits(
    manifest_path: Path,
    output_dir: Path,
    batch_size: int = 32
):
    """
    Extracts features for train, val, and test splits defined in manifest.
    Saves numpy arrays to output_dir.
    """
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    classes = sorted(manifest["classes"])
    class_to_idx = {c: i for i, c in enumerate(classes)}
    output_dir.mkdir(parents=True, exist_ok=True)

    extractor = MobileNetFeatureExtractor()

    for split in ["train", "val", "test"]:
        print(f"\nProcessing {split.upper()} split ({len(manifest[split])} samples)...")
        items = manifest[split]
        paths = [item["path"] for item in items]
        labels = [class_to_idx[item["label"]] for item in items]

        X = extractor.extract_batch(paths, batch_size=batch_size)
        y = np.array(labels[:len(X)], dtype=np.int64)

        np.save(output_dir / f"X_{split}.npy", X)
        np.save(output_dir / f"y_{split}.npy", y)
        print(f"  Saved {split.upper()}: X shape {X.shape}, y shape {y.shape}")

    # Save class mappings
    with open(output_dir / "classes.json", "w", encoding="utf-8") as f:
        json.dump({
            "classes": classes,
            "class_to_idx": class_to_idx,
            "idx_to_class": {i: c for c, i in class_to_idx.items()}
        }, f, indent=2)

    print(f"\nFeature extraction complete! Processed files stored in: {output_dir}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Extract MobileNetV2 Features")
    parser.add_argument("--manifest", type=str, default="data/splits/split_manifest.json")
    parser.add_argument("--output-dir", type=str, default="data/processed")
    parser.add_argument("--batch-size", type=int, default=32)
    args = parser.parse_args()

    process_splits(Path(args.manifest), Path(args.output_dir), args.batch_size)
