import React, { useState, useEffect } from 'react';
import { Activity, Award, CheckCircle, BarChart3, Database } from 'lucide-react';
import { apiFetch, getApiUrl, BACKEND_URL_CHANGED_EVENT } from '../api/config';

export default function AnalyticsView() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();

    const handleUrlChange = () => {
      fetchMetrics();
    };

    window.addEventListener(BACKEND_URL_CHANGED_EVENT, handleUrlChange);
    return () => {
      window.removeEventListener(BACKEND_URL_CHANGED_EVENT, handleUrlChange);
    };
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/metrics');
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
      <div className="glass-card analytics-state-box">
        <div className="loading-spinner state-spinner" />
        <p className="state-desc">
          Fetching empirical evaluation metrics from held-out test split...
        </p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="glass-card analytics-state-box">
        <p className="state-error-title">Evaluation Metrics Unavailable</p>
        <p className="state-error-desc">{error}</p>
        <button className="btn-primary state-retry-btn" onClick={fetchMetrics}>
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
    <div className="analytics-layout">
      {/* Top Stat Cards */}
      <div className="metrics-card-grid">
        <div className="metric-stat-card border-top-blue">
          <div className="stat-num stat-blue">{(primary.test_accuracy * 100).toFixed(2)}%</div>
          <div className="stat-label">Test Set Accuracy</div>
        </div>
        <div className="metric-stat-card border-top-yellow">
          <div className="stat-num stat-dark">{primary.f1_macro.toFixed(4)}</div>
          <div className="stat-label">Macro F1-Score</div>
        </div>
        <div className="metric-stat-card border-top-red">
          <div className="stat-num stat-red">{primary.precision_macro.toFixed(4)}</div>
          <div className="stat-label">Macro Precision</div>
        </div>
        <div className="metric-stat-card border-top-blue">
          <div className="stat-num stat-yellow">{summary.test_sample_count}</div>
          <div className="stat-label">Unseen Test Samples</div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table (Viva Core) */}
      <div className="glass-card">
        <h3 className="card-title">
          <Award size={20} className="icon-blue" />
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
                      <strong className="algo-name">{comp.model_name}</strong>
                      {isPrimary && (
                        <span className="selected-model-badge">
                          Selected Model
                        </span>
                      )}
                    </td>
                    <td className="cell-muted">{comp.type}</td>
                    <td className="cell-mono cell-bold">
                      {(comp.test_accuracy * 100).toFixed(2)}%
                    </td>
                    <td className="cell-mono">{comp.macro_f1.toFixed(4)}</td>
                    <td className="cell-mono">{comp.weighted_f1.toFixed(4)}</td>
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
          <BarChart3 size={20} className="icon-blue" />
          Test Set Confusion Matrix
        </h3>
        <p className="card-desc">
          Row = True Actual Class, Column = Predicted Class by Random Forest.
        </p>

        <div className="matrix-view-split">
          {/* Interactive Matrix Table */}
          <div className="data-table-container matrix-table-container">
            <table className="data-table matrix-table">
              <thead>
                <tr>
                  <th>True \ Pred</th>
                  {cm.classes.map((c, i) => (
                    <th key={i} title={c} className="text-center">
                      {c.replace('_', ' ').slice(0, 7)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cm.raw_matrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="matrix-row-label">
                      {cm.classes[rIdx].replace('_', ' ')}
                    </td>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      let cellClass = 'matrix-val-cell';
                      if (isDiagonal && val > 0) cellClass += ' cell-diagonal-hit';
                      else if (!isDiagonal && val > 0) cellClass += ' cell-error-hit';
                      else cellClass += ' cell-zero';

                      return (
                        <td key={cIdx} className={cellClass}>
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
          <div className="heatmap-container">
            <img
              src={getApiUrl('/model-artifacts/confusion_matrix.png')}
              alt="Confusion Matrix Heatmap"
              className="heatmap-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <p className="heatmap-caption">
              High-resolution evaluated heatmap saved in models/confusion_matrix.png
            </p>
          </div>
        </div>
      </div>

      {/* Per-Class Performance Breakdown */}
      {primary.per_class && (
        <div className="glass-card">
          <h3 className="card-title">
            <Database size={20} className="icon-blue" />
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
                {Object.entries(primary.per_class).map(([clsName, classMetrics]) => (
                  <tr key={clsName}>
                    <td>
                      <strong className="algo-name">{clsName.replace('_', ' ').toUpperCase()}</strong>
                    </td>
                    <td className="cell-mono">{classMetrics.precision.toFixed(4)}</td>
                    <td className="cell-mono">{classMetrics.recall.toFixed(4)}</td>
                    <td className="cell-mono cell-bold cell-f1-val">
                      {classMetrics.f1_score.toFixed(4)}
                    </td>
                    <td className="cell-mono">{classMetrics.support}</td>
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
