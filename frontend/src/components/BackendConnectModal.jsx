import React, { useState, useEffect } from 'react';
import {
  Server,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  X,
  Radio,
  Zap,
  Info
} from 'lucide-react';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  checkBackendHealth
} from '../api/config';

export default function BackendConnectModal({ isOpen, onClose, onConnectionChanged }) {
  const [urlInput, setUrlInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: bool, data?: any, error?: string }
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'guide'

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getApiBaseUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async (overrideUrl) => {
    const urlToTest = overrideUrl !== undefined ? overrideUrl : urlInput;
    setIsTesting(true);
    setTestResult(null);
    const result = await checkBackendHealth(urlToTest);
    setTestResult(result);
    setIsTesting(false);
    return result;
  };

  const handleSave = async () => {
    const trimmed = urlInput.trim();
    setApiBaseUrl(trimmed);
    if (onConnectionChanged) {
      onConnectionChanged(trimmed);
    }
    onClose();
  };

  const handleResetToDefault = () => {
    setUrlInput('');
    setApiBaseUrl('');
    setTestResult(null);
    if (onConnectionChanged) {
      onConnectionChanged('');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card modal-container backend-connect-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Server className="icon-blue" size={22} />
            <div>
              <h2 className="modal-title">Connect Backend & ML Pipeline</h2>
              <p className="modal-subtitle">
                Link this Vercel frontend to your local machine's ML model
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Radio size={14} /> Connection Settings
          </button>
          <button
            className={`modal-tab ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            <HelpCircle size={14} /> Tunnel Setup Guide
          </button>
        </div>

        {activeTab === 'settings' ? (
          <div className="modal-body">
            <div className="info-banner">
              <Info size={18} className="info-icon" />
              <p>
                Because Vercel is hosted on <strong>HTTPS</strong>, browsers require your local
                backend to be exposed through a secure tunnel URL (e.g., from Cloudflare, ngrok, or Pinggy).
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="backend-url-input">
                Backend HTTPS Tunnel URL
              </label>
              <div className="input-with-button">
                <input
                  id="backend-url-input"
                  type="url"
                  className="form-input"
                  placeholder="https://your-tunnel-subdomain.trycloudflare.com or https://xxxx.ngrok-free.app"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTest();
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleTest()}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" /> Testing...
                    </>
                  ) : (
                    'Test Ping'
                  )}
                </button>
              </div>
              <span className="form-help">
                Leave blank to use default (local proxy or Vercel env variable <code>VITE_API_BASE_URL</code>).
              </span>
            </div>

            {/* Test result state */}
            {testResult && (
              <div
                className={`test-feedback-box ${
                  testResult.ok ? 'feedback-success' : 'feedback-error'
                }`}
              >
                {testResult.ok ? (
                  <>
                    <CheckCircle2 size={18} className="icon-success" />
                    <div className="feedback-content">
                      <strong>Connected Successfully!</strong>
                      <p>
                        Model Status: {testResult.data?.status} · Readiness:{' '}
                        {testResult.data?.model_ready ? 'Ready (Loaded)' : 'Needs Training'} · Device:{' '}
                        {testResult.data?.device}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={18} className="icon-error" />
                    <div className="feedback-content">
                      <strong>Connection Failed</strong>
                      <p>{testResult.error}</p>
                      <small>Ensure your local FastAPI server and tunnel are running.</small>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={handleResetToDefault}
              >
                Reset to Default
              </button>
              <div className="actions-right">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={handleSave}>
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="modal-body modal-guide">
            <h4 className="guide-title">How to tunnel your local backend to Vercel</h4>

            <div className="guide-step">
              <span className="step-badge">1</span>
              <div>
                <strong>Start your local FastAPI server</strong>
                <p>Run in your FreshCheck terminal:</p>
                <pre className="code-snippet">.\venv\Scripts\python.exe backend/run_server.py</pre>
                <small>Server will listen at http://127.0.0.1:8000</small>
              </div>
            </div>

            <div className="guide-step">
              <span className="step-badge">2</span>
              <div>
                <strong>Expose it via a free HTTPS tunnel</strong>
                <p>Choose any of the following 3 options in a second terminal:</p>

                <div className="guide-options-card">
                  <div className="option-row">
                    <span className="option-name">Option A: Cloudflare (Recommended, 100% Free, No login)</span>
                    <pre className="code-snippet">cloudflared tunnel --url http://127.0.0.1:8000</pre>
                  </div>

                  <div className="option-row">
                    <span className="option-name">Option B: Windows built-in SSH (Pinggy, Zero install)</span>
                    <pre className="code-snippet">ssh -p 443 -R0:localhost:8000 a.pinggy.io</pre>
                  </div>

                  <div className="option-row">
                    <span className="option-name">Option C: ngrok</span>
                    <pre className="code-snippet">ngrok http 8000</pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="guide-step">
              <span className="step-badge">3</span>
              <div>
                <strong>Copy the HTTPS URL and paste it above</strong>
                <p>
                  Copy the generated <code>https://...</code> URL, switch back to the "Connection Settings"
                  tab, paste it, and click <strong>Test Ping</strong> & <strong>Save</strong>!
                </p>
              </div>
            </div>

            <div className="guide-note">
              <Zap size={16} />
              <span>
                <strong>Tip for permanent deployment:</strong> In your Vercel Project Settings &rarr;
                Environment Variables, add <code>VITE_API_BASE_URL</code> with your tunnel URL.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
