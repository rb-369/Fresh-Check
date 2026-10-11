import React from 'react';
import { Eye } from 'lucide-react';

export default function SamplePicker({ samples, onSelectSample, disabled }) {
  if (!samples || samples.length === 0) return null;

  return (
    <div className="sample-gallery-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Quick 1-Click Viva Test Presets
        </span>
        <span style={{ fontSize: '0.74rem', color: '#6b7280' }}>
          Select any sample to test instantly
        </span>
      </div>

      <div className="sample-strip">
        {samples.map((sample) => {
          const isFresh = sample.category === 'fresh';
          return (
            <div
              key={sample.id}
              className="sample-card"
              onClick={() => !disabled && onSelectSample(sample)}
              title={`Click to test ${sample.displayName}`}
            >
              <img
                src={sample.url}
                alt={sample.displayName}
                className="sample-thumb"
                loading="lazy"
              />
              <p className="sample-name">
                <span className={`sample-status-dot ${isFresh ? 'dot-fresh' : 'dot-spoiled'}`} />
                {sample.displayName}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
