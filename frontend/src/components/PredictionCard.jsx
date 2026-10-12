import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, Clock, ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function PredictionCard({ result, previewUrl }) {
  const [showProbabilities, setShowProbabilities] = useState(false);

  if (!result) return null;

  const isFresh = result.freshness_status === 'fresh';
  const confidencePercent = result.model_confidence * 100;

  return (
    <div className="glass-card result-card">
      <div className="result-badge-row">
        <div className={`status-badge ${isFresh ? 'fresh' : 'spoiled'}`}>
          {isFresh ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{isFresh ? 'Visually Intact Surface' : 'Visible Surface Degradation'}</span>
        </div>
        <div className="latency-pill">
          <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Latency: {result.inference_time_ms} ms
        </div>
      </div>

      <div>
        <h2 className="produce-headline">{result.display_name}</h2>
        <p className="produce-category">
          Detected Produce Category: <strong className="produce-type-label">{result.produce_type}</strong>
        </p>
      </div>

      {/* Model Confidence Meter */}
      <div className="confidence-box">
        <div className="confidence-header">
          <span className="confidence-label">
            Model Prediction Confidence
          </span>
          <span className="confidence-value">{result.model_confidence_percent}</span>
        </div>
        <div className="gauge-track">
          <div
            className={`gauge-fill ${isFresh ? 'gauge-fresh' : 'gauge-spoiled'}`}
            style={{ width: `${Math.min(Math.max(confidencePercent, 10), 100)}%` }}
          />
        </div>
        <p className="confidence-caveat">
          * Random Forest vote proportion across decision trees; not a guaranteed biological freshness measure.
        </p>
      </div>

      {/* Visual Observation */}
      <div className="assessment-box">
        <p className="assessment-title">
          Visual Observation:
        </p>
        <p className="assessment-text">{result.visual_assessment}</p>
      </div>

      {/* Responsible AI & Safety Advisory */}
      <div className="safety-alert">
        <ShieldAlert size={20} className="safety-icon" />
        <div>
          <strong className="safety-title">Responsible AI & Food Safety Advisory</strong>
          <span className="safety-desc">{result.safety_advisory}</span>
        </div>
      </div>

      {/* Detailed Tree Ensemble Voting Distribution */}
      {result.class_probabilities && (
        <div className="breakdown-wrapper">
          <button
            onClick={() => setShowProbabilities(!showProbabilities)}
            className="breakdown-toggle-btn"
          >
            <span>Tree Ensemble Voting Breakdown ({Object.keys(result.class_probabilities).length} Classes)</span>
            {showProbabilities ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showProbabilities && (
            <div className="breakdown-list">
              {Object.entries(result.class_probabilities)
                .sort((a, b) => b[1] - a[1])
                .map(([cls, prob]) => {
                  const probPct = (prob * 100).toFixed(1);
                  const isWinner = cls === result.predicted_class;
                  return (
                    <div
                      key={cls}
                      className={`breakdown-item ${isWinner ? 'winner' : ''}`}
                    >
                      <span className="breakdown-label">
                        {cls.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="breakdown-percent">
                        {probPct}% votes
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
