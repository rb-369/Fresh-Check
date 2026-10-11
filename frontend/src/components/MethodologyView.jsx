import React from 'react';
import { BookOpen, Layers, ShieldCheck, Cpu, GitFork, AlertCircle } from 'lucide-react';

export default function MethodologyView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card">
        <h2 className="card-title">
          <Layers size={22} color="#10b981" />
          FreshCheck ML Pipeline Architecture
        </h2>
        <p className="card-desc">
          How raw produce images are converted into dense feature representations and classified using an ensemble of decision trees.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: '#34d399', fontSize: '0.95rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={16} /> 1. Feature Extraction (MobileNetV2)
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5 }}>
              Instead of flattening raw pixels (which destroys spatial relationships and creates over 150,000 dimensions), we pass images through a pretrained MobileNetV2 backbone. The final dense classification head is removed, yielding a structured <strong>1280-dimensional feature embedding</strong> per image capturing color, contours, textures, and surface blemishes.
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: '#38bdf8', fontSize: '0.95rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GitFork size={16} /> 2. Random Forest Classification
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5 }}>
              The 1280-D tabular vectors are fed into an ensemble of <strong>Random Forest</strong> trees. Each tree evaluates a random subspace of features on bootstrap sample sets (Bagging), reducing variance and eliminating the severe overfitting typically observed in single decision trees.
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: '#fbbf24', fontSize: '0.95rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} /> 3. Strict 70 / 15 / 15 Split
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5 }}>
              We enforce a <strong>Stratified Train (70%) / Validation (15%) / Test (15%) split</strong>. Hyperparameters (<code style={{ color: '#fff' }}>n_estimators</code>, <code style={{ color: '#fff' }}>max_depth</code>) are tuned purely on validation data. The test split is kept strictly unseen until final evaluation to guarantee zero data leakage.
            </p>
          </div>
        </div>
      </div>

      {/* Critical Theory & Viva Insights */}
      <div className="glass-card">
        <h3 className="card-title">
          <AlertCircle size={20} color="#f59e0b" />
          Key Machine Learning & Viva Theoretical Principles
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem', color: '#d1d5db' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '0.3rem' }}>
              Why Random Forest Over a Single Decision Tree?
            </strong>
            A single decision tree creates hard orthogonal splits and suffers from high variance (sensitive to minor training variations). Random Forest aggregates multiple decorrelated trees via bootstrap aggregating and random feature selection, effectively reducing variance while maintaining low bias.
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '0.3rem' }}>
              Why "Model Confidence" Rather Than "Calibrated Freshness"?
            </strong>
            In scikit-learn, Random Forest's <code style={{ color: '#38bdf8' }}>predict_proba()</code> computes the fraction of decision trees in the ensemble voting for a given class. While highly indicative of classification certainty, tree vote fractions are not calibrated posterior probabilities in a Bayesian sense. FreshCheck explicitly denotes this metric as <em>Model Confidence</em>.
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '0.3rem' }}>
              Responsible AI & Food Safety Limitation
            </strong>
            An optical camera only records 2D surface reflectance. It cannot detect internal rotting, core mold, bacterial toxins (e.g. <em>Salmonella</em>, <em>E. coli</em>), chemical contaminants, or spoilage odors. The system provides visual guidance only and never provides a medical or safety guarantee.
          </div>
        </div>
      </div>
    </div>
  );
}
