import React from 'react';
import { getApiUrl } from '../api/config';

export default function SamplePicker({ samples, onSelectSample, disabled }) {
  if (!samples || samples.length === 0) return null;

  // Pick one distinct sample for each of the 6 trained classes
  const targetClasses = [
    'fresh_apple',
    'rotten_apple',
    'fresh_banana',
    'rotten_banana',
    'fresh_orange',
    'rotten_orange'
  ];

  const distinctSamples = targetClasses.map(
    (cls) => samples.find((s) => s.label === cls) || samples.find((s) => s.id.includes(cls))
  ).filter(Boolean);

  const displayList = distinctSamples.length === 6 ? distinctSamples : samples.slice(0, 6);

  return (
    <div className="sample-gallery-section">
      <div className="sample-header-row">
        <span className="sample-heading">
          1-Click Viva Presets · 6 Classes
        </span>
        <span className="sample-subheading">
          Tap any produce to test
        </span>
      </div>

      <div className="sample-grid">
        {displayList.map((sample) => {
          const isFresh = sample.category === 'fresh';
          return (
            <button
              type="button"
              key={sample.id}
              className={`sample-card ${isFresh ? 'preset-fresh' : 'preset-spoiled'}`}
              onClick={() => !disabled && onSelectSample(sample)}
              title={`Test ${sample.displayName} (${isFresh ? 'Fresh' : 'Rotten'})`}
              disabled={disabled}
            >
              <img
                src={getApiUrl(sample.url)}
                alt={sample.displayName}
                className="sample-thumb"
                loading="lazy"
              />
              <p className="sample-name">
                <span className={`sample-status-dot ${isFresh ? 'dot-fresh' : 'dot-spoiled'}`} />
                {sample.displayName}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
