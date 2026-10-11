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
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.2rem' }}>
          Detected Produce Category: <strong style={{ color: '#fff' }}>{result.produce_type}</strong>
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
          * Note: Random Forest vote proportion across decision trees, not a guaranteed biological freshness measure.
        </p>
      </div>

      {/* Visual Observation */}
      <div className="assessment-box">
        <p style={{ fontWeight: 600, color: '#e5e7eb', marginBottom: '0.25rem' }}>
          Visual Observation:
        </p>
        <p>{result.visual_assessment}</p>
      </div>

      {/* Responsible AI & Safety Advisory */}
      <div className="safety-alert">
        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Responsible AI & Food Safety Advisory</strong>
          <span>{result.safety_advisory}</span>
        </div>
      </div>

      {/* Detailed Tree Ensemble Voting Distribution */}
      {result.class_probabilities && (
        <div style={{ marginTop: '0.5rem' }}>
          <button
            onClick={() => setShowProbabilities(!showProbabilities)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0'
            }}
          >
            <span>Tree Ensemble Voting Breakdown ({Object.keys(result.class_probabilities).length} Classes)</span>
            {showProbabilities ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showProbabilities && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {Object.entries(result.class_probabilities)
                .sort((a, b) => b[1] - a[1])
                .map(([cls, prob]) => {
                  const probPct = (prob * 100).toFixed(1);
                  const isWinner = cls === result.predicted_class;
                  return (
                    <div
                      key={cls}
                      style={{
                        background: isWinner ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.2)',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        border: isWinner ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent'
                      }}
                    >
                      <span style={{ color: isWinner ? '#34d399' : '#d1d5db', fontWeight: isWinner ? 700 : 500 }}>
                        {cls.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: isWinner ? '#34d399' : '#9ca3af' }}>
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
