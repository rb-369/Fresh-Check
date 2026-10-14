import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Trash2,
  Filter,
  RefreshCw,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Search,
  Sparkles
} from 'lucide-react';
import { apiFetch, BACKEND_URL_CHANGED_EVENT } from '../api/config';

export default function HistoryView({ onSelectScanForReview }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbStatus, setDbStatus] = useState({ connected: false, status: 'checking' });
  const [selectedProduce, setSelectedProduce] = useState('all');
  const [selectedFreshness, setSelectedFreshness] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedProduce !== 'all') params.append('produce_type', selectedProduce);
      if (selectedFreshness !== 'all') params.append('freshness_status', selectedFreshness);

      const url = `/api/history?${params.toString()}`;
      const res = await apiFetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load history (HTTP ${res.status})`);
      }
      const data = await res.json();
      setHistoryItems(data.items || []);
      setDbStatus({
        connected: data.db_connected,
        status: data.db_status || (data.db_connected ? 'connected' : 'disconnected')
      });
    } catch (err) {
      console.error('History fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProduce, selectedFreshness]);

  useEffect(() => {
    fetchHistory();

    const handleUrlChange = () => {
      fetchHistory();
    };

    window.addEventListener(BACKEND_URL_CHANGED_EVENT, handleUrlChange);
    return () => {
      window.removeEventListener(BACKEND_URL_CHANGED_EVENT, handleUrlChange);
    };
  }, [fetchHistory]);

  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this inspection record from MongoDB Atlas?')) return;

    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete inspection.');
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all scan history from MongoDB Atlas? This cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    try {
      const res = await apiFetch('/api/history', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear history.');
      setHistoryItems([]);
    } catch (err) {
      alert(`Clear history error: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="history-layout">
      {/* Top Header Card */}
      <div className="glass-card history-header-card">
        <div className="history-header-top">
          <div>
            <h2 className="card-title">
              <History size={22} className="icon-blue" />
              Inspection History
            </h2>
            <p className="card-desc">
              All visual food freshness scans logged to MongoDB Atlas with Cloudinary hosted photographs.
            </p>
          </div>

          <div className="history-actions-row">
            <button
              className="btn-secondary history-refresh-btn"
              onClick={fetchHistory}
              disabled={loading}
              title="Refresh History"
            >
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>

            {historyItems.length > 0 && (
              <button
                className="btn-secondary history-clear-btn"
                onClick={handleClearAll}
                disabled={isClearing}
                title="Clear All Records"
              >
                <Trash2 size={14} />
                <span>{isClearing ? 'Clearing...' : 'Clear All'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Database Status Alert Banner */}
        <div className={`db-status-banner ${dbStatus.connected ? 'db-connected' : 'db-disconnected'}`}>
          <div className="db-banner-left">
            <Database size={16} />
            <span>
              <strong>MongoDB Atlas:</strong>{' '}
              {dbStatus.connected
                ? `Connected · ${historyItems.length} inspection${historyItems.length === 1 ? '' : 's'} loaded`
                : 'Not connected. Set MONGO_URI in your backend .env file to enable cloud persistence.'}
            </span>
          </div>
          <span className={`db-indicator-dot ${dbStatus.connected ? 'dot-green' : 'dot-amber'}`} />
        </div>

        {/* Filter Controls */}
        <div className="history-filter-bar">
          <div className="filter-group">
            <span className="filter-label">Produce:</span>
            <div className="filter-pills">
              {['all', 'Apple', 'Banana', 'Orange'].map((p) => (
                <button
                  key={p}
                  className={`filter-pill ${selectedProduce === p ? 'active' : ''}`}
                  onClick={() => setSelectedProduce(p)}
                >
                  {p === 'all' ? 'All Produce' : p}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Status:</span>
            <div className="filter-pills">
              {[
                { id: 'all', label: 'All Status' },
                { id: 'fresh', label: 'Fresh' },
                { id: 'spoiled', label: 'Spoiled' },
                { id: 'uncertain', label: 'Uncertain' }
              ].map((s) => (
                <button
                  key={s.id}
                  className={`filter-pill ${selectedFreshness === s.id ? 'active' : ''}`}
                  onClick={() => setSelectedFreshness(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="glass-card history-state-box">
          <div className="loading-spinner state-spinner" />
          <p className="state-desc">Loading scan records from MongoDB Atlas...</p>
        </div>
      ) : error ? (
        <div className="glass-card history-state-box">
          <AlertCircle size={32} className="state-error-icon" />
          <p className="state-error-title">Unable to Load History</p>
          <p className="state-error-desc">{error}</p>
          <button className="btn-primary state-retry-btn" onClick={fetchHistory}>
            Retry Fetching
          </button>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="glass-card history-empty-card">
          <div className="empty-icon-wrap">🍏</div>
          <h3 className="empty-title">No Scan Records Found</h3>
          <p className="empty-desc">
            {selectedProduce !== 'all' || selectedFreshness !== 'all'
              ? 'No inspections matched your current filter criteria. Try resetting the filters.'
              : 'Scan an apple, banana, or orange in the Freshness Scanner tab to record your first visual freshness inspection in MongoDB Atlas.'}
          </p>
        </div>
      ) : (
        <div className="history-grid">
          {historyItems.map((item) => {
            const isFresh = item.freshness_status === 'fresh';
            const isUncertain = item.freshness_status === 'uncertain' || item.model_confidence < 0.5;

            return (
              <div key={item.id} className="history-card">
                {/* Image Section */}
                <div className="history-card-img-wrap">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.display_name}
                      className="history-card-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="history-img-placeholder">
                      <span>{item.produce_type === 'Apple' ? '🍎' : item.produce_type === 'Banana' ? '🍌' : '🍊'}</span>
                    </div>
                  )}

                  <span
                    className={`history-status-tag ${
                      isUncertain ? 'tag-uncertain' : isFresh ? 'tag-fresh' : 'tag-spoiled'
                    }`}
                  >
                    {isUncertain ? (
                      <AlertCircle size={12} />
                    ) : isFresh ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <AlertTriangle size={12} />
                    )}
                    <span>{isUncertain ? 'Uncertain' : isFresh ? 'Fresh' : 'Spoiled'}</span>
                  </span>

                  <button
                    className="history-delete-item-btn"
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    disabled={deletingId === item.id}
                    title="Delete record"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Body Details */}
                <div className="history-card-body">
                  <div className="history-card-meta-row">
                    <span className="history-produce-title">{item.display_name}</span>
                    <span className="history-confidence-pill">
                      {item.model_confidence_percent || `${(item.model_confidence * 100).toFixed(1)}%`}
                    </span>
                  </div>

                  <p className="history-assessment-snippet">{item.visual_assessment}</p>

                  <div className="history-card-footer">
                    <span className="history-timestamp">
                      <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      {formatTimestamp(item.created_at)}
                    </span>
                    {item.inference_time_ms && (
                      <span className="history-latency">{item.inference_time_ms} ms</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
