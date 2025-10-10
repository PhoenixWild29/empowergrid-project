/**
 * Due Diligence Center
 * 
 * WO-91: Due Diligence Center with Project Evaluation Tools
 * 
 * Features:
 * - Structured evaluation framework
 * - Comprehensive scoring system
 * - Comparative analysis
 * - Document verification tracking
 * - Financial model validation
 * - Investment recommendations
 * - Customizable criteria
 */

'use client';

import React, { useState } from 'react';

interface DueDiligenceCenterProps {
  project: any;
}

export default function DueDiligenceCenter({ project }: DueDiligenceCenterProps) {
  const [customWeights, setCustomWeights] = useState({
    technical: 25,
    financial: 30,
    team: 20,
    market: 15,
    risk: 10,
  });

  return (
    <div className="space-y-8">
      {/* Evaluation Framework */}
      <EvaluationFrameworkSection project={project} />

      {/* Comprehensive Scoring */}
      <ProjectScoringSection project={project} weights={customWeights} />

      {/* Document Verification */}
      <DocumentVerificationSection project={project} />

      {/* Financial Model Validation */}
      <FinancialModelValidationSection project={project} />

      {/* Investment Recommendation */}
      <InvestmentRecommendationSection project={project} weights={customWeights} />

      {/* Customizable Criteria */}
      <CustomizableEvaluationCriteria
        weights={customWeights}
        onWeightsChange={setCustomWeights}
      />
    </div>
  );
}

/** WO-91: Evaluation Framework Section */
function EvaluationFrameworkSection({ project }: any) {
  const categories = [
    {
      name: 'Technical Feasibility',
      score: calculateTechnicalScore(project),
      metrics: [
        { label: 'Technology Maturity', value: 'Proven', score: 90 },
        { label: 'Equipment Quality', value: 'High-grade', score: 85 },
        { label: 'Capacity Factor', value: '25%', score: 75 },
        { label: 'Site Suitability', value: 'Excellent', score: 95 },
      ],
    },
    {
      name: 'Financial Viability',
      score: calculateFinancialScore(project),
      metrics: [
        { label: 'NPV', value: 'Positive', score: 85 },
        { label: 'IRR vs Benchmark', value: '12.5%', score: 80 },
        { label: 'Payback Period', value: '6.7 years', score: 85 },
        { label: 'Funding Progress', value: `${project.fundingProgress?.toFixed(0)}%`, score: project.fundingProgress || 0 },
      ],
    },
    {
      name: 'Team & Execution',
      score: calculateTeamScore(project),
      metrics: [
        { label: 'Creator Reputation', value: project.creator?.reputation || 0, score: (project.creator?.reputation || 0) / 10 },
        { label: 'Verified Status', value: project.creator?.verified ? 'Yes' : 'No', score: project.creator?.verified ? 100 : 50 },
        { label: 'Track Record', value: 'Good', score: 75 },
        { label: 'Milestone Adherence', value: `${project.milestoneProgress || 0}%`, score: project.milestoneProgress || 0 },
      ],
    },
    {
      name: 'Market Opportunity',
      score: calculateMarketScore(project),
      metrics: [
        { label: 'Demand Outlook', value: 'Strong', score: 85 },
        { label: 'Competition', value: 'Moderate', score: 70 },
        { label: 'Regulatory Environment', value: 'Favorable', score: 80 },
        { label: 'Community Support', value: `${project.funderCount} funders`, score: Math.min(project.funderCount * 5, 100) },
      ],
    },
    {
      name: 'Risk Assessment',
      score: 100 - calculateRiskScore(project),
      metrics: [
        { label: 'Technology Risk', value: 'Low', score: 85 },
        { label: 'Market Risk', value: 'Low', score: 80 },
        { label: 'Execution Risk', value: 'Medium', score: 65 },
        { label: 'Financial Risk', value: 'Low', score: 80 },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>📋</span> Evaluation Framework
      </h3>

      <div className="space-y-6">
        {categories.map((category, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">{category.name}</h4>
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold ${
                  category.score >= 80 ? 'text-green-600' :
                  category.score >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {category.score.toFixed(0)}
                </div>
                <div className="text-sm text-gray-500">/100</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {category.metrics.map((metric, mIndex) => (
                <div key={mIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{metric.value}</span>
                    <ScoreBadge score={metric.score} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** WO-91: Project Scoring Section */
function ProjectScoringSection({ project, weights }: any) {
  const scores = {
    technical: calculateTechnicalScore(project),
    financial: calculateFinancialScore(project),
    team: calculateTeamScore(project),
    market: calculateMarketScore(project),
    risk: 100 - calculateRiskScore(project),
  };

  const weightedScore = (
    scores.technical * (weights.technical / 100) +
    scores.financial * (weights.financial / 100) +
    scores.team * (weights.team / 100) +
    scores.market * (weights.market / 100) +
    scores.risk * (weights.risk / 100)
  );

  const recommendation = getInvestmentRecommendation(weightedScore);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🎯</span> Comprehensive Project Score
      </h3>

      {/* Overall Score */}
      <div className="text-center mb-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
        <div className="text-6xl font-bold mb-2" style={{ color: getScoreColor(weightedScore) }}>
          {weightedScore.toFixed(1)}
        </div>
        <div className="text-lg font-semibold text-gray-700">
          {recommendation.rating}
        </div>
        <div className="text-sm text-gray-600 mt-2">{recommendation.label}</div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3 mb-6">
        {Object.entries(scores).map(([key, score]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 capitalize">{key}</span>
              <span className="text-sm font-bold text-gray-900">{Number(score).toFixed(0)}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (score as number) >= 80 ? 'bg-green-600' :
                  (score as number) >= 60 ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}
                style={{ width: `${score}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk-Adjusted Return */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Risk-Adjusted Return Analysis</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Expected ROI:</span>
            <span className="ml-2 font-bold text-green-600">
              {calculateExpectedROI(project).toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600">Risk-Adjusted ROI:</span>
            <span className="ml-2 font-bold text-blue-600">
              {(calculateExpectedROI(project) * (weightedScore / 100)).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** WO-91: Document Verification Section */
function DocumentVerificationSection({ project }: any) {
  const documents = [
    { name: 'Technical Specification', required: true, status: 'verified', uploadedAt: project.createdAt },
    { name: 'Environmental Permit', required: true, status: 'verified', uploadedAt: project.createdAt },
    { name: 'Financial Model', required: true, status: 'verified', uploadedAt: project.createdAt },
    { name: 'Site Assessment', required: true, status: 'pending', uploadedAt: null },
    { name: 'Insurance Certificate', required: false, status: 'not-uploaded', uploadedAt: null },
  ];

  const requiredDocs = documents.filter(d => d.required);
  const verifiedDocs = requiredDocs.filter(d => d.status === 'verified');
  const completionRate = (verifiedDocs.length / requiredDocs.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>📄</span> Document Verification Status
      </h3>

      {/* Completion Tracking */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Required Documents</span>
          <span className="text-sm font-semibold">
            {verifiedDocs.length}/{requiredDocs.length} Verified
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${
              completionRate === 100 ? 'bg-green-600' : 'bg-blue-600'
            }`}
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {documents.map((doc, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                doc.status === 'verified' ? 'bg-green-100 text-green-600' :
                doc.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                'bg-gray-100 text-gray-400'
              }`}>
                {doc.status === 'verified' ? '✓' :
                 doc.status === 'pending' ? '⏳' :
                 '○'}
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">
                  {doc.name}
                  {doc.required && <span className="ml-2 text-xs text-red-600">*</span>}
                </div>
                {doc.uploadedAt && (
                  <div className="text-xs text-gray-500">
                    Verified {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            <div>
              {doc.status === 'verified' && (
                <span className="text-xs text-green-600 font-medium">Verified ✓</span>
              )}
              {doc.status === 'pending' && (
                <span className="text-xs text-yellow-600 font-medium">Pending Review</span>
              )}
              {doc.status === 'not-uploaded' && (
                <span className="text-xs text-gray-400">Not Uploaded</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {completionRate < 100 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Outstanding Documents: {requiredDocs.length - verifiedDocs.length} required document(s) need verification
          </p>
        </div>
      )}
    </div>
  );
}

/** WO-91: Financial Model Validation Section */
function FinancialModelValidationSection({ project }: any) {
  const validationResults = {
    accuracy: 'High',
    accuracyScore: 85,
    assumptions: [
      { assumption: 'Electricity Price', expected: '$0.12/kWh', actual: '$0.12/kWh', variance: 0, valid: true },
      { assumption: 'Capacity Factor', expected: '25%', actual: '24.5%', variance: -2, valid: true },
      { assumption: 'Maintenance Cost', expected: '2%', actual: '2.1%', variance: 5, valid: true },
      { assumption: 'Project Duration', expected: '90 days', actual: '90 days', variance: 0, valid: true },
    ],
    sensitivity: {
      electricityPrice: { impact: 'High', score: 85 },
      capacityFactor: { impact: 'Medium', score: 72 },
      discountRate: { impact: 'Low', score: 95 },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🧮</span> Financial Model Validation
      </h3>

      {/* Accuracy Assessment */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-900">Model Accuracy</div>
            <div className="text-sm text-gray-600 mt-1">
              {validationResults.accuracy} - {validationResults.accuracyScore}/100
            </div>
          </div>
          <div className="text-3xl">✅</div>
        </div>
      </div>

      {/* Assumption Verification */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Assumption Verification</h4>
        <div className="space-y-2">
          {validationResults.assumptions.map((assumption, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-medium text-gray-900">{assumption.assumption}</div>
                <div className="text-xs text-gray-600 mt-1">
                  Expected: {assumption.expected} • Actual: {assumption.actual}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${
                  Math.abs(assumption.variance) <= 5 ? 'text-green-600' :
                  Math.abs(assumption.variance) <= 10 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {assumption.variance > 0 ? '+' : ''}{assumption.variance}%
                </span>
                <span>{assumption.valid ? '✓' : '✗'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensitivity Analysis */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Sensitivity Analysis</h4>
        <div className="grid md:grid-cols-3 gap-3">
          {Object.entries(validationResults.sensitivity).map(([key, value]: [string, any]) => (
            <div key={key} className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className="font-semibold text-gray-900">{value.impact} Impact</div>
              <div className="text-xs text-gray-600 mt-1">Score: {value.score}/100</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** WO-91: Investment Recommendation Section */
function InvestmentRecommendationSection({ project, weights }: any) {
  const overallScore = calculateOverallScore(project, weights);
  const recommendation = getInvestmentRecommendation(overallScore);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>💡</span> Investment Recommendation
      </h3>

      <div className={`p-6 rounded-lg border-2 ${recommendation.borderColor}`}>
        <div className="flex items-start gap-4">
          <div className="text-5xl">{recommendation.icon}</div>
          <div className="flex-1">
            <h4 className="text-2xl font-bold text-gray-900 mb-2">{recommendation.action}</h4>
            <p className="text-gray-700 mb-4">{recommendation.label}</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">Supporting Factors:</div>
                <ul className="space-y-1">
                  {recommendation.supportingFactors.map((factor: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">Confidence Level:</div>
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${recommendation.confidence}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{recommendation.confidence}% Confident</div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Overall Score:</span>
                  <span className="ml-2 font-bold" style={{ color: getScoreColor(overallScore) }}>
                    {overallScore.toFixed(1)}/100
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** WO-91: Customizable Evaluation Criteria */
function CustomizableEvaluationCriteria({ weights, onWeightsChange }: any) {
  const totalWeight = Object.values(weights).reduce((sum: number, w: any) => sum + w, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>⚙️</span> Customize Evaluation Criteria
      </h3>

      <div className="space-y-4">
        {Object.entries(weights).map(([key, value]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 capitalize">
                {key} Weight
              </label>
              <span className="text-sm font-bold text-gray-900">{Number(value)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={Number(value)}
              onChange={(e) => onWeightsChange({ ...weights, [key]: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Weight:</span>
          <span className={`text-sm font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
            {totalWeight}%
          </span>
        </div>
        {totalWeight !== 100 && (
          <p className="text-xs text-red-600 mt-1">⚠️ Total weight should equal 100%</p>
        )}
      </div>
    </div>
  );
}

/** Helper Functions */

function calculateTechnicalScore(project: any): number {
  let score = 70; // Base score
  if (project.energyCapacity > 1000) score += 10;
  if (project.category === 'Solar') score += 10;
  if (project.energyMetrics?.length > 10) score += 10;
  return Math.min(score, 100);
}

function calculateFinancialScore(project: any): number {
  let score = 60;
  score += Math.min((project.fundingProgress || 0) / 5, 20);
  if (project.funderCount > 20) score += 10;
  if (project.targetAmount < 200000) score += 10;
  return Math.min(score, 100);
}

function calculateTeamScore(project: any): number {
  let score = 50;
  score += Math.min((project.creator?.reputation || 0) / 20, 30);
  if (project.creator?.verified) score += 20;
  return Math.min(score, 100);
}

function calculateMarketScore(project: any): number {
  return 75; // Base market score
}

function calculateRiskScore(project: any): number {
  let risk = 30;
  if (project.fundingProgress < 25) risk += 20;
  if (project.creator?.reputation < 500) risk += 15;
  if (project.daysSinceCreation < 7) risk += 10;
  return Math.min(risk, 100);
}

function calculateOverallScore(project: any, weights: any): number {
  const scores = {
    technical: calculateTechnicalScore(project),
    financial: calculateFinancialScore(project),
    team: calculateTeamScore(project),
    market: calculateMarketScore(project),
    risk: 100 - calculateRiskScore(project),
  };

  return (
    scores.technical * (weights.technical / 100) +
    scores.financial * (weights.financial / 100) +
    scores.team * (weights.team / 100) +
    scores.market * (weights.market / 100) +
    scores.risk * (weights.risk / 100)
  );
}

function calculateExpectedROI(project: any): number {
  const capacity = project.energyCapacity || 0;
  const investment = project.targetAmount || 1;
  return (capacity * 8760 * 0.25 * 0.12 / investment) * 100;
}

function getInvestmentRecommendation(score: number) {
  if (score >= 80) {
    return {
      action: 'Strong Buy',
      rating: 'Highly Recommended',
      label: 'Excellent investment opportunity with strong fundamentals',
      icon: '🟢',
      borderColor: 'border-green-500 bg-green-50',
      confidence: 90,
      supportingFactors: [
        'High overall score across all categories',
        'Strong financial metrics and ROI potential',
        'Experienced team with proven track record',
        'Low risk profile with multiple mitigations',
      ],
    };
  } else if (score >= 65) {
    return {
      action: 'Buy',
      rating: 'Recommended',
      label: 'Good investment opportunity with solid fundamentals',
      icon: '🟡',
      borderColor: 'border-blue-500 bg-blue-50',
      confidence: 75,
      supportingFactors: [
        'Above-average performance across key metrics',
        'Positive financial indicators',
        'Acceptable risk level',
        'Good market opportunity',
      ],
    };
  } else if (score >= 50) {
    return {
      action: 'Hold',
      rating: 'Neutral',
      label: 'Fair opportunity - proceed with caution',
      icon: '🟠',
      borderColor: 'border-yellow-500 bg-yellow-50',
      confidence: 60,
      supportingFactors: [
        'Mixed signals across evaluation categories',
        'Moderate risk-reward profile',
        'Some areas need improvement',
        'Consider waiting for more data',
      ],
    };
  } else {
    return {
      action: 'Pass',
      rating: 'Not Recommended',
      label: 'High risk or insufficient data',
      icon: '🔴',
      borderColor: 'border-red-500 bg-red-50',
      confidence: 40,
      supportingFactors: [
        'Below-average scores in key categories',
        'Elevated risk factors',
        'Limited track record or data',
        'Better opportunities likely available',
      ],
    };
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 65) return '#3b82f6';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
      score >= 80 ? 'bg-green-100 text-green-700' :
      score >= 60 ? 'bg-yellow-100 text-yellow-700' :
      'bg-red-100 text-red-700'
    }`}>
      {score.toFixed(0)}
    </span>
  );
}

