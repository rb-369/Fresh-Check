import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import CameraCapture from './components/CameraCapture';
import PredictionCard from './components/PredictionCard';
import SamplePicker from './components/SamplePicker';
import AnalyticsView from './components/AnalyticsView';
import MethodologyView from './components/MethodologyView';
import HistoryView from './components/HistoryView';
import BackendConnectModal from './components/BackendConnectModal';
import ModelReadyHud from './components/ModelReadyHud';
import {
  UploadCloud,
  Camera,
  Sparkles,
  AlertCircle,
  Server,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  apiFetch,
  checkBackendHealth,
  getApiBaseUrl,
  BACKEND_URL_CHANGED_EVENT
} from './api/config';

export default function App() {
  const getInitialTab = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['scanner', 'analytics', 'history', 'methodology'].includes(tabParam)) {
        return tabParam;
      }
      const hash = window.location.hash.replace('#', '');
      if (hash && ['scanner', 'analytics', 'history', 'methodology'].includes(hash)) {
        return hash;
      }
    } catch {
      // fallback
    }
    return 'scanner';
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url);
    } catch {
      // fallback
    }
  };

  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'camera'
  const [selectedImage, setSelectedImage] = useState(null); // { file, dataUrl, name }
  const [samples, setSamples] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Backend connection status state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState({
    isOnline: false,
    checked: false,
    url: ''
  });

  const checkConnection = useCallback(async () => {
    const currentBase = getApiBaseUrl();
    const result = await checkBackendHealth();
    setBackendStatus({
      isOnline: result.ok,
      checked: true,
      url: currentBase,
      device: result.data?.device,
      modelReady: result.data?.model_ready
    });
    return result.ok;
  }, []);

  const fetchSamples = useCallback(async () => {
    try {
      const res = await apiFetch('/api/sample-images');
      if (res.ok) {
        const data = await res.json();
        setSamples(data);
      }
    } catch (err) {
      console.warn('Could not fetch sample gallery:', err);
    }
  }, []);

  // Initial probe and event listener for backend URL changes
  useEffect(() => {
    checkConnection().then((online) => {
      if (online) {
        fetchSamples();
      }
    });

    const handleUrlChange = () => {
      checkConnection().then(() => fetchSamples());
    };

    window.addEventListener(BACKEND_URL_CHANGED_EVENT, handleUrlChange);
    return () => {
      window.removeEventListener(BACKEND_URL_CHANGED_EVENT, handleUrlChange);
    };
  }, [checkConnection, fetchSamples]);

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

      // Fetch the sample image through the configured API client
      const res = await apiFetch(sample.url);
      if (!res.ok) {
        throw new Error(`Failed to download sample (HTTP ${res.status})`);
      }
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
      const response = await apiFetch('/api/predict', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Prediction failed (HTTP ${response.status})`);
      }

      const result = await response.json();
      setPredictionResult(result);
      setBackendStatus((prev) => ({ ...prev, isOnline: true }));
    } catch (err) {
      console.error('Inference error:', err);
      const isMixedOrNet =
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.name === 'TypeError';

      if (isMixedOrNet && !backendStatus.url && window.location.hostname.includes('vercel.app')) {
        setApiError(
          'Cannot reach local backend from Vercel. Please click "Connect Backend" above to enter your HTTPS tunnel URL.'
        );
      } else {
        setApiError(err.message || 'Error occurred while contacting prediction model.');
      }
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
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
      />

      {/* Backend connection helper banner if offline on Vercel */}
      {backendStatus.checked && !backendStatus.isOnline && (
        <div className="backend-alert-banner">
          <div className="alert-banner-content">
            <Server size={18} className="alert-banner-icon" />
            <div>
              <strong>Local ML Backend Not Connected:</strong> If running from Vercel, start your
              local backend and tunnel, then link it using the button on the right.
            </div>
          </div>
          <button
            type="button"
            className="btn-banner-action"
            onClick={() => setIsConnectModalOpen(true)}
          >
            Connect Backend
          </button>
        </div>
      )}

      <main>
        {activeTab === 'scanner' && (
          <div className="scanner-grid">
            {/* Left Column: Image Input & Controls */}
            <div className="glass-card">
              <h2 className="card-title">
                <Sparkles size={20} className="icon-blue" />
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
                <div className="action-btn-wrapper">
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
                <div className="api-error-alert">
                  <AlertCircle size={16} className="api-error-icon" />
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

            {/* Right Column: Results Card or Live Model HUD */}
            <div>
              {predictionResult ? (
                <PredictionCard result={predictionResult} previewUrl={selectedImage?.dataUrl} />
              ) : (
                <ModelReadyHud
                  samples={samples}
                  onSelectSample={handleSelectSample}
                  disabled={isAnalyzing}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'history' && <HistoryView />}

        {activeTab === 'methodology' && <MethodologyView />}
      </main>

      {/* Backend Connection Modal */}
      <BackendConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnectionChanged={() => {
          checkConnection().then(() => fetchSamples());
        }}
      />
    </div>
  );
}
