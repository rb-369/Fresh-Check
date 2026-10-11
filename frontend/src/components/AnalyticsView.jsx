import React, { useState, useEffect } from 'react';
import { Activity, Award, CheckCircle, BarChart3, Database } from 'lucide-react';

export default function AnalyticsView() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/metrics');
      if (!res.ok) {
        throw new Error(`Failed to load metrics (HTTP ${res.status}). Ensure evaluate.py has executed.`);
      }
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 1rem', width: '28px', height: '28px' }} />
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
          Fetching empirical evaluation metrics from held-out test split...
        </p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
        <p style={{ color: '#f87171', fontWeight: 600, marginBottom: '0.5rem' }}>Evaluation Metrics Unavailable</p>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</p>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={fetchMetrics}>
          Retry Fetching Metrics
        </button>
      </div>
    );
  }

  const primary = metrics.primary_model;
  const summary = metrics.dataset_summary;
  const cm = metrics.confusion_matrix;
  const comparisons = metrics.model_comparison;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Stat Cards */}
      <div className="metrics-card-grid">
        <div className="metric-stat-card">
          <div className="stat-num">{(primary.test_accuracy * 100).toFixed(2)}%</div>
          <div className="stat-label">Test Set Accuracy</div>
        </div>
        <div className="metric-stat-card">
          <div className="stat-num" style={{ color: '#38bdf8' }}>{primary.f1_macro.toFixed(4)}</div>
          <div className="stat-label">Macro F1-Score</div>
        </div>
        <div className="metric-stat-card">
          <div className="stat-num" style={{ color: '#a78bfa' }}>{primary.precision_macro.toFixed(4)}</div>
          <div className="stat-label">Macro Precision</div>
        </div>
        <div className="metric-stat-card">
          <div className="stat-num" style={{ color: '#fbbf24' }}>{summary.test_sample_count}</div>
          <div className="stat-label">Unseen Test Samples</div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table (Viva Core) */}
      <div className="glass-card">
        <h3 className="card-title">
          <Award size={20} color="#10b981" />
          Empirical Classifier Benchmark Comparison
        </h3>
        <p className="card-desc">
          Evaluated on the exact same held-out test split (MobileNetV2 1280-D feature vectors).
        </p>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Architecture Role</th>
                <th>Test Accuracy</th>
                <th>Macro F1</th>
                <th>Weighted F1</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((comp, idx) => {
                const isPrimary = comp.model_name.includes('Random Forest');
                return (
                  <tr key={idx} className={isPrimary ? 'highlight-row' : ''}>
                    <td>
                      <strong>{comp.model_name}</strong>
                      {isPrimary && (
                        <span style={{
                          marginLeft: '8px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#34d399',
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          Selected Model
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#9ca3af' }}>{comp.type}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {(comp.test_accuracy * 100).toFixed(2)}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{comp.macro_f1.toFixed(4)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{comp.weighted_f1.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrix Section */}
      <div className="glass-card">
        <h3 className="card-title">
          <BarChart3 size={20} color="#38bdf8" />
          Test Set Confusion Matrix
        </h3>
        <p className="card-desc">
          Row = True Actual Class, Column = Predicted Class by Random Forest.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
          {/* Interactive Matrix Table */}
          <div className="data-table-container" style={{ margin: 0 }}>
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>True \ Pred</th>
                  {cm.classes.map((c, i) => (
                    <th key={i} title={c} style={{ textAlign: 'center' }}>
                      {c.replace('_', ' ').slice(0, 7)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cm.raw_matrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ fontWeight: 600, color: '#9ca3af' }}>
                      {cm.classes[rIdx].replace('_', ' ')}
                    </td>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      return (
                        <td
                          key={cIdx}
                          style={{
                            textAlign: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: isDiagonal ? 700 : 400,
                            background: isDiagonal && val > 0 ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                            color: isDiagonal ? '#34d399' : val > 0 ? '#fb7185' : '#6b7280'
                          }}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rendered Matplotlib Heatmap Image */}
          <div style={{ textAlign: 'center' }}>
            <img
              src="/model-artifacts/confusion_matrix.png"
              alt="Confusion Matrix Heatmap"
              style={{
                width: '100%',
                maxHeight: '340px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: '#fff'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.4rem' }}>
              High-resolution evaluated heatmap saved in models/confusion_matrix.png
            </p>
          </div>
        </div>
      </div>

      {/* Per-Class Performance Breakdown */}
      {primary.per_class && (
        <div className="glass-card">
          <h3 className="card-title">
            <Database size={20} color="#a78bfa" />
            Class-wise Precision, Recall & F1 Breakdown
          </h3>
          <p className="card-desc">
            Performance metrics broken down per produce freshness category.
          </p>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class Label</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                  <th>Test Samples (Support)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(primary.per_class).map(([clsName, metrics]) => (
                  <tr key={clsName}>
                    <td>
                      <strong>{clsName.replace('_', ' ').toUpperCase()}</strong>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{metrics.precision.toFixed(4)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{metrics.recall.toFixed(4)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#34d399' }}>
                      {metrics.f1_score.toFixed(4)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{metrics.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
