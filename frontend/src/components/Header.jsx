import React from 'react';
import { Sparkles, Activity, BookOpen, ShieldCheck } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="header">
      <div className="brand-wrapper">
        <div className="logo-badge" role="img" aria-label="FreshCheck Logo">
          🍏
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="brand-title">FreshCheck</h1>
            <span className="clg-badge">ML Microproject</span>
          </div>
          <p className="brand-subtitle">
            Visual Food Freshness Classifier • MobileNetV2 + Random Forest
          </p>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Main Navigation">
        <button
          className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          <Sparkles size={16} />
          Freshness Scanner
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Activity size={16} />
          Model Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'methodology' ? 'active' : ''}`}
          onClick={() => setActiveTab('methodology')}
        >
          <BookOpen size={16} />
          Methodology & Ethics
        </button>
      </nav>
    </header>
  );
}
