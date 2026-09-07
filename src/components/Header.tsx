import React from 'react';

export const Header: React.FC = () => {
  return (
    <div className="hero-banner mb-8">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="badge-pill badge-primary">
          🎯 ENTERPRISE TALENT INTELLIGENCE
        </span>
        <span className="badge-pill badge-success">
          ⚡ PRECISION MATCHING
        </span>
        <span className="badge-pill badge-warning">
          📊 REAL-TIME RANKING
        </span>
      </div>

      <h1 className="hero-title">
        AI Resume Screening &amp; Decision Support System
      </h1>
      <p className="hero-subtitle">
        Automated NLP &amp; Machine Learning platform to extract candidate qualifications,
        parse skills and experience, perform semantic TF-IDF matching, and rank applicants for any job description.
      </p>
    </div>
  );
};
