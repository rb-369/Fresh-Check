import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import CameraCapture from './components/CameraCapture';
import PredictionCard from './components/PredictionCard';
import SamplePicker from './components/SamplePicker';
import AnalyticsView from './components/AnalyticsView';
import MethodologyView from './components/MethodologyView';
import { UploadCloud, Camera, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'camera'
  const [selectedImage, setSelectedImage] = useState(null); // { file, dataUrl, name }
  const [samples, setSamples] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Fetch sample images on initial load
  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      const res = await fetch('/api/sample-images');
      if (res.ok) {
        const data = await res.json();
        setSamples(data);
      }
    } catch (err) {
      console.warn('Could not fetch sample gallery:', err);
    }
  };

  const handleImageSelected = (imgData) => {
    setSelectedImage(imgData);
    setPredictionResult(null);
    setApiError(null);
  };

  const handleSelectSample = async (sample) => {
    try {
      setIsAnalyzing(true);
      setApiError(null);
      setPredictionResult(null);

      // Fetch the sample image as blob
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], sample.filename, { type: 'image/jpeg' });
      const dataUrl = URL.createObjectURL(blob);

      setSelectedImage({
        file: file,
        dataUrl: dataUrl,
        name: sample.displayName
      });

      // Directly trigger prediction
      await runPrediction(file);
    } catch (err) {
      console.error('Error loading sample image:', err);
      setApiError('Failed to load sample image for testing.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runPrediction = async (fileToAnalyze) => {
    const file = fileToAnalyze || selectedImage?.file;
    if (!file) return;

    setIsAnalyzing(true);
    setApiError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Prediction failed (HTTP ${response.status})`);
      }

      const result = await response.json();
      setPredictionResult(result);
    } catch (err) {
      console.error('Inference error:', err);
      setApiError(err.message || 'Error occurred while contacting prediction model.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setPredictionResult(null);
    setApiError(null);
  };

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main>
        {activeTab === 'scanner' && (
          <div className="scanner-grid">
            {/* Left Column: Image Input & Controls */}
            <div className="glass-card">
              <h2 className="card-title">
                <Sparkles size={20} color="#10b981" />
                Produce Visual Scanner
              </h2>
              <p className="card-desc">
                Take a live photo or upload an image of an apple, banana, or orange to inspect surface freshness.
              </p>

              {/* Mode Switcher */}
              <div className="input-switcher">
                <button
                  className={`switch-btn ${inputMode === 'upload' ? 'active' : ''}`}
                  onClick={() => {
                    setInputMode('upload');
                    if (selectedImage && selectedImage.name === 'Camera Snapshot') {
                      clearSelection();
                    }
                  }}
                >
                  <UploadCloud size={16} />
                  Upload Photo
                </button>
                <button
                  className={`switch-btn ${inputMode === 'camera' ? 'active' : ''}`}
                  onClick={() => {
                    setInputMode('camera');
                    clearSelection();
                  }}
                >
                  <Camera size={16} />
                  Live Camera
                </button>
              </div>

              {/* Active Input Element or Selected Preview */}
              {selectedImage ? (
                <div className="preview-container">
                  <img src={selectedImage.dataUrl} alt="Selected Produce" className="preview-img" />
                  <button className="clear-btn" onClick={clearSelection} title="Choose different photo">
                    ✕ Change Photo
                  </button>
                </div>
              ) : inputMode === 'upload' ? (
                <ImageUploader onImageSelected={handleImageSelected} disabled={isAnalyzing} />
              ) : (
                <CameraCapture onCapture={handleImageSelected} disabled={isAnalyzing} />
              )}

              {/* Action Button */}
              {selectedImage && !predictionResult && (
                <div style={{ marginTop: '1.25rem' }}>
                  <button
                    className="btn-primary"
                    onClick={() => runPrediction()}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="loading-spinner" />
                        Extracting Features & Classifying...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Analyze Produce Freshness
                      </>
                    )}
                  </button>
                </div>
              )}

              {apiError && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.82rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Preloaded Test Presets */}
              <SamplePicker
                samples={samples}
                onSelectSample={handleSelectSample}
                disabled={isAnalyzing}
              />
            </div>

            {/* Right Column: Results Card or Placeholder */}
            <div>
              {predictionResult ? (
                <PredictionCard result={predictionResult} previewUrl={selectedImage?.dataUrl} />
              ) : (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '360px', textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Awaiting Produce Image
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem', maxWidth: '320px', lineHeight: 1.5 }}>
                    Snap a photo with your camera, upload an image from your files, or tap any sample preset below to inspect freshness.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'methodology' && <MethodologyView />}
      </main>
    </div>
  );
}
