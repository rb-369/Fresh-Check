import React from 'react';
import { Sparkles, Activity, BookOpen, Server } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  backendStatus = { isOnline: false, isCustom: false },
  onOpenConnectModal
}) {
  return (
    <header className="header">
      <div className="brand-wrapper">
        <div className="logo-badge" role="img" aria-label="FreshCheck Logo">
          🍏
        </div>
        <div className="brand-text-block">
          <div className="brand-headline-row">
            <h1 className="brand-title">FreshCheck</h1>
            <span className="clg-badge">ML Microproject</span>
          </div>
          <p className="brand-subtitle">
            Visual Food Freshness Classifier · MobileNetV2 + Random Forest
          </p>
        </div>
      </div>

      <div className="header-right-group">
        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            <Sparkles size={16} />
            <span className="tab-label-full">Freshness Scanner</span>
            <span className="tab-label-short">Scanner</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Activity size={16} />
            <span className="tab-label-full">Model Analytics</span>
            <span className="tab-label-short">Analytics</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'methodology' ? 'active' : ''}`}
            onClick={() => setActiveTab('methodology')}
          >
            <BookOpen size={16} />
            <span className="tab-label-full">Methodology & Ethics</span>
            <span className="tab-label-short">Methodology</span>
          </button>
        </nav>

        {/* Backend / Tunnel Status Pill */}
        <button
          type="button"
          className={`backend-status-pill ${
            backendStatus.isOnline ? 'pill-online' : 'pill-offline'
          }`}
          onClick={onOpenConnectModal}
          title="Click to configure local backend / tunnel URL"
        >
          <span className="status-indicator-dot" />
          <Server size={14} />
          <span className="status-pill-text">
            {backendStatus.isOnline ? 'Local ML Online' : 'Connect Backend'}
          </span>
        </button>
      </div>
    </header>
  );
}

