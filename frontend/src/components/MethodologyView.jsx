import React from 'react';
import { BookOpen, Layers, ShieldCheck, Cpu, GitFork, AlertCircle } from 'lucide-react';

export default function MethodologyView() {
  return (
    <div className="methodology-layout">
      <div className="glass-card">
        <h2 className="card-title">
          <Layers size={22} className="icon-blue" />
          FreshCheck ML Pipeline Architecture
        </h2>
        <p className="card-desc">
          How raw produce images are converted into dense feature representations and classified using an ensemble of decision trees.
        </p>

        <div className="arch-card-grid">
          <div className="arch-step-card border-top-blue">
            <h4 className="arch-step-title title-blue">
              <Cpu size={16} /> 1. Feature Extraction (MobileNetV2)
            </h4>
            <p className="arch-step-desc">
              Instead of flattening raw pixels (which destroys spatial relationships and creates over 150,000 dimensions), we pass images through a pretrained MobileNetV2 backbone. The final dense classification head is removed, yielding a structured <strong>1280-dimensional feature embedding</strong> per image capturing color, contours, textures, and surface blemishes.
            </p>
          </div>

          <div className="arch-step-card border-top-yellow">
            <h4 className="arch-step-title title-yellow">
              <GitFork size={16} /> 2. Random Forest Classification
            </h4>
            <p className="arch-step-desc">
              The 1280-D tabular vectors are fed into an ensemble of <strong>Random Forest</strong> trees. Each tree evaluates a random subspace of features on bootstrap sample sets (Bagging), reducing variance and eliminating the severe overfitting typically observed in single decision trees.
            </p>
          </div>

          <div className="arch-step-card border-top-red">
            <h4 className="arch-step-title title-red">
              <ShieldCheck size={16} /> 3. Strict 70 / 15 / 15 Split
            </h4>
            <p className="arch-step-desc">
              We enforce a <strong>Stratified Train (70%) / Validation (15%) / Test (15%) split</strong>. Hyperparameters (<code className="code-tag">n_estimators</code>, <code className="code-tag">max_depth</code>) are tuned purely on validation data. The test split is kept strictly unseen until final evaluation to guarantee zero data leakage.
            </p>
          </div>
        </div>
      </div>

      {/* Critical Theory & Viva Insights */}
      <div className="glass-card">
        <h3 className="card-title">
          <AlertCircle size={20} className="icon-yellow" />
          Key Machine Learning & Viva Theoretical Principles
        </h3>
        
        <div className="viva-principles-list">
          <div className="principle-callout border-left-blue">
            <strong className="principle-heading">
              Why Random Forest Over a Single Decision Tree?
            </strong>
            <p className="principle-body">
              A single decision tree creates hard orthogonal splits and suffers from high variance (sensitive to minor training variations). Random Forest aggregates multiple decorrelated trees via bootstrap aggregating and random feature selection, effectively reducing variance while maintaining low bias.
            </p>
          </div>

          <div className="principle-callout border-left-yellow">
            <strong className="principle-heading">
              Why "Model Confidence" Rather Than "Calibrated Freshness"?
            </strong>
            <p className="principle-body">
              In scikit-learn, Random Forest's <code className="code-tag">predict_proba()</code> computes the fraction of decision trees in the ensemble voting for a given class. While highly indicative of classification certainty, tree vote fractions are not calibrated posterior probabilities in a Bayesian sense. FreshCheck explicitly denotes this metric as <em>Model Confidence</em>.
            </p>
          </div>

          <div className="principle-callout border-left-red">
            <strong className="principle-heading">
              Responsible AI & Food Safety Limitation
            </strong>
            <p className="principle-body">
              An optical camera only records 2D surface reflectance. It cannot detect internal rotting, core mold, bacterial toxins (e.g. <em>Salmonella</em>, <em>E. coli</em>), chemical contaminants, or spoilage odors. The system provides visual guidance only and never provides a medical or safety guarantee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
