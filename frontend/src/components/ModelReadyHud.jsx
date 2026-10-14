import React from 'react';
import { Cpu, Layers, Sparkles, CheckCircle2, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function ModelReadyHud({ samples, onSelectSample, disabled }) {
  // Grab 3 sample shortcuts if available
  const quickSamples = samples?.slice(0, 3) || [];

  return (
    <div className="glass-card model-hud-card">
      <div className="hud-header">
        <div className="hud-title-wrap">
          <span className="hud-pulse-dot" />
          <h3 className="hud-title">MobileNetV2 + Random Forest Pipeline</h3>
        </div>
        <span className="hud-status-badge">
          <Zap size={13} className="hud-status-icon" /> Ready for Inference
        </span>
      </div>

      <p className="hud-subtitle">
        Visual food freshness inspection powered by deep feature transfer learning + ensemble decision trees.
      </p>

      {/* Architecture Spec Grid */}
      <div className="hud-specs-grid">
        <div className="hud-spec-item">
          <div className="hud-spec-header">
            <Layers size={15} className="icon-blue" />
            <span className="hud-spec-name">Feature Extractor</span>
          </div>
          <div className="hud-spec-value">MobileNetV2</div>
          <div className="hud-spec-sub">1,280-D dense bottleneck vectors</div>
        </div>

        <div className="hud-spec-item">
          <div className="hud-spec-header">
            <Cpu size={15} className="icon-blue" />
            <span className="hud-spec-name">Classifier Head</span>
          </div>
          <div className="hud-spec-value">Random Forest</div>
          <div className="hud-spec-sub">100 trees · Gini impurity split</div>
        </div>

        <div className="hud-spec-item">
          <div className="hud-spec-header">
            <Activity size={15} className="icon-blue" />
            <span className="hud-spec-name">Empirical Accuracy</span>
          </div>
          <div className="hud-spec-value stat-blue">97.5%+</div>
          <div className="hud-spec-sub">Evaluated on held-out test split</div>
        </div>

        <div className="hud-spec-item">
          <div className="hud-spec-header">
            <Zap size={15} className="icon-blue" />
            <span className="hud-spec-name">Inference Latency</span>
          </div>
          <div className="hud-spec-value">&lt; 45 ms</div>
          <div className="hud-spec-sub">Real-time local CPU execution</div>
        </div>
      </div>

      {/* Target Classes Matrix */}
      <div className="hud-classes-section">
        <div className="hud-section-header">
          <span className="hud-section-title">Produce Classes Inspected</span>
          <span className="hud-section-note">Binary Freshness (Fresh vs Rotten)</span>
        </div>

        <div className="hud-class-pills-row">
          <span className="hud-class-pill pill-fresh">🍏 Fresh Apple</span>
          <span className="hud-class-pill pill-spoiled">🍎 Rotten Apple</span>
          <span className="hud-class-pill pill-fresh">🍌 Fresh Banana</span>
          <span className="hud-class-pill pill-spoiled">🍌 Rotten Banana</span>
          <span className="hud-class-pill pill-fresh">🍊 Fresh Orange</span>
          <span className="hud-class-pill pill-spoiled">🍊 Rotten Orange</span>
        </div>
      </div>

      {/* Quick Viva Action Callout */}
      <div className="hud-quickstart-box">
        <div className="hud-quickstart-text">
          <strong>⚡ Quick Viva Test:</strong> Choose any preset image below or upload a photo to inspect surface degradation and view confidence distributions.
        </div>
        {quickSamples.length > 0 && (
          <div className="hud-quick-buttons">
            {quickSamples.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className="btn-quick-sample"
                disabled={disabled}
                onClick={() => onSelectSample(sample)}
              >
                Test {sample.displayName}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
