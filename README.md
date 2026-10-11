# FreshCheck — Food Freshness Classifier 🍏

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://vitejs.dev)
[![scikit-learn](https://img.shields.io/badge/ML-Random%20Forest-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![PyTorch](https://img.shields.io/badge/Backbone-MobileNetV2-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org)

An intelligent visual food freshness classification system developed as a Machine Learning Microproject. It analyzes produce surface images (Apples, Bananas, Oranges) to classify item identity and surface condition into **Fresh** or **Spoiled** using **MobileNetV2 feature embeddings** coupled with a tuned **Random Forest Classifier**.

---

## 🚀 Key Features

- **Hybrid Computer Vision Architecture**: Strips the top dense layer of a pretrained **MobileNetV2** backbone to extract dense **1280-dimensional semantic embeddings**, transforming raw image pixels into structured tabular features.
- **Ensemble Learning with Random Forest**: Primary classifier trained with validation set hyperparameter tuning.
- **Empirical Comparative Study**: Rigorous baseline benchmarking against **Decision Tree** and **Support Vector Machine (SVM)** on the identical held-out test split.
- **Mobile-Friendly React Frontend**:
  - Live device camera snapshot / webcam viewfinder.
  - Drag-and-drop file uploader.
  - 1-Click pre-loaded test gallery for seamless viva demonstrations.
  - **Dynamic Model Analytics Dashboard**: Directly bound to empirical evaluation metrics (`metrics.json`) with interactive confusion matrix and algorithm comparison tables.
  - Clear **Model Confidence** gauge and **Responsible AI Food Safety** notices.
- **FastAPI Model Serving**: Sub-50ms inference latency with interactive Swagger documentation at `/docs`.

---

## 📁 Repository Structure

```
FreshCheck/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI application with CORS & routes
│   │   ├── model_service.py      # MobileNetV2 + Random Forest inference
│   │   ├── schemas.py            # Pydantic data contracts
│   │   └── samples/              # Preloaded sample images for 1-click test
│   ├── run_server.py             # Uvicorn launcher script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx        # App header & navigation tabs
│   │   │   ├── ImageUploader.jsx # Drag & drop dropzone
│   │   │   ├── CameraCapture.jsx # Mobile camera & webcam snapshot
│   │   │   ├── PredictionCard.jsx# Freshness result, confidence & safety tips
│   │   │   ├── SamplePicker.jsx  # 1-click viva test presets
│   │   │   ├── AnalyticsView.jsx # Dynamic test metrics & confusion matrix
│   │   │   └── MethodologyView.jsx # Architecture & theoretical viva guide
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── ml_pipeline/
│   ├── download_dataset.py       # Balanced dataset acquisition
│   ├── data_loader.py            # Stratified 70% Train / 15% Val / 15% Test splitter
│   ├── feature_extractor.py      # MobileNetV2 1280-D feature extractor
│   ├── train.py                  # Random Forest validation tuning & baselines
│   └── evaluate.py               # Final empirical test evaluation & metrics.json
├── models/
│   ├── freshcheck_rf.joblib      # Primary trained Random Forest model
│   ├── baseline_dt.joblib        # Baseline Decision Tree model
│   ├── baseline_svm.joblib       # Baseline Support Vector Machine model
│   ├── metrics.json              # Empirical test metrics
│   └── confusion_matrix.png      # High-res confusion matrix heatmap
├── requirements.txt
└── README.md
```

---

## 🔬 Machine Learning Pipeline Execution

To run the complete pipeline from scratch:

```bash
# 1. Setup Python Virtual Environment
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# 2. Acquire Dataset and Split (Stratified 70% Train / 15% Val / 15% Test)
python ml_pipeline/download_dataset.py
python ml_pipeline/data_loader.py

# 3. Extract MobileNetV2 Feature Embeddings (1280-D vectors)
python ml_pipeline/feature_extractor.py

# 4. Train Classifiers with Validation Set Hyperparameter Tuning
python ml_pipeline/train.py

# 5. Evaluate on Held-out Unseen Test Split
python ml_pipeline/evaluate.py
```

---

## 📊 Measured Empirical Results (Test Split)

All figures below are actual measured outputs from `models/metrics.json` evaluated on the held-out test split:

| Classifier Model | Architecture Role | Test Accuracy | Macro F1 | Weighted F1 |
| :--- | :--- | :---: | :---: | :---: |
| **Random Forest (Ensemble)** | **Primary (Tuned Ensemble)** | **100.00%** | **1.0000** | **1.0000** |
| Support Vector Machine (RBF) | Baseline (Kernelized Linear) | 100.00% | 1.0000 | 1.0000 |
| Decision Tree (Single) | Baseline (Single Estimator) | 92.59% | 0.9262 | 0.9262 |

---

## 💻 Running the Application

### 1. Launch FastAPI Backend Service
```bash
python backend/run_server.py
```
- API Endpoint: `http://127.0.0.1:8000`
- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`

### 2. Launch React Frontend
```bash
cd frontend
npm install
npm run dev
```
- Frontend UI: `http://localhost:5173`

---

## 🛡️ Responsible AI & Food Safety Notice
> **Important**: FreshCheck evaluates surface optical reflectance from photograph images only. An RGB image classifier **cannot detect internal spoilage, bacterial contamination (e.g. *Salmonella*, *Listeria*), invisible fungal mycotoxins, or degradation odors**. The application displays **Model Prediction Confidence** rather than a guaranteed biological freshness metric, and should never be used as a definitive determination of food safety.
