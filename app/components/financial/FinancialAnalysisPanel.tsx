/**
 * Financial Analysis Panel
 * 
 * WO-79: Financial Analysis with Investment Metrics
 * Comprehensive financial analysis and ROI projections
 * 
 * Features:
 * - Funding analytics with visual indicators
 * - ROI projections (conservative, expected, optimistic)
 * - Investment risk assessment
 * - Key financial metrics (NPV, IRR, Payback Period, LCOE)
 * - Comparative analysis vs benchmarks
 * - Interactive financial modeling
 */

'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface FinancialAnalysisPanelProps {
  project: any;
}

export default function FinancialAnalysisPanel({ project }: FinancialAnalysisPanelProps) {
  return (
    <div className="space-y-8">
      {/* Funding Analytics */}
      <FundingAnalyticsSection project={project} />

      {/* ROI Projections */}
      <ROIProjectionsSection project={project} />

      {/* Key Financial Metrics */}
      <KeyFinancialMetricsSection project={project} />

      {/* Investment Risk Assessment */}
      <InvestmentRiskAssessmentSection project={project} />

      {/* Interactive Financial Modeling */}
      <InteractiveFinancialModelingSection project={project} />

      {/* Comparative Analysis */}
      <ComparativeAnalysisSection project={project} />
    </div>
  );
}

/** WO-79: Funding Analytics Section */
function FundingAnalyticsSection({ project }: any) {
  const fundingByMonth = generateFundingTimeline(project.fundings);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>💵</span> Funding Analytics
      </h3>
      
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Required"
          value={`$${project.targetAmount.toLocaleString()}`}
          icon="🎯"
        />
        <MetricCard
          label="Total Secured"
          value={`$${project.currentAmount.toLocaleString()}`}
          icon="✅"
          highlight
        />
        <MetricCard
          label="Remaining"
          value={`$${(project.targetAmount - project.currentAmount).toLocaleString()}`}
          icon="⏳"
        />
        <MetricCard
          label="Progress"
          value={`${project.fundingProgress.toFixed(1)}%`}
          icon="📈"
        />
      </div>

      {/* Funding Timeline Chart */}
      <div className="h-64">
        <h4 className="font-semibold text-gray-700 mb-4">Funding Timeline</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={fundingByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} name="Funding Amount ($)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** WO-79: ROI Projections Section */
function ROIProjectionsSection({ project }: any) {
  const scenarios = calculateROIScenarios(project);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>📊</span> ROI Projections
      </h3>
      
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <ScenarioCard
          title="Conservative"
          roi={scenarios.conservative.roi}
          period={scenarios.conservative.years}
          color="text-blue-600"
        />
        <ScenarioCard
          title="Expected"
          roi={scenarios.expected.roi}
          period={scenarios.expected.years}
          color="text-green-600"
          highlighted
        />
        <ScenarioCard
          title="Optimistic"
          roi={scenarios.optimistic.roi}
          period={scenarios.optimistic.years}
          color="text-purple-600"
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
        <p className="font-semibold mb-2">Projection Assumptions:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>Conservative:</strong> 15% capacity factor, $0.10/kWh, 8% discount rate</li>
          <li><strong>Expected:</strong> 25% capacity factor, $0.12/kWh, 6% discount rate</li>
          <li><strong>Optimistic:</strong> 35% capacity factor, $0.15/kWh, 4% discount rate</li>
        </ul>
      </div>
    </div>
  );
}

/** WO-79: Key Financial Metrics Section */
function KeyFinancialMetricsSection({ project }: any) {
  const metrics = calculateFinancialMetrics(project);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>💰</span> Key Financial Metrics
      </h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="NPV (Net Present Value)"
          value={`$${metrics.npv.toLocaleString()}`}
          icon="📈"
          tooltip="Present value of future cash flows minus initial investment"
        />
        <MetricCard
          label="IRR (Internal Rate of Return)"
          value={`${metrics.irr.toFixed(2)}%`}
          icon="📊"
          tooltip="Annual growth rate of investment"
        />
        <MetricCard
          label="Payback Period"
          value={`${metrics.paybackPeriod.toFixed(1)} years`}
          icon="⏱️"
          tooltip="Time to recover initial investment"
        />
        <MetricCard
          label="LCOE (Levelized Cost of Energy)"
          value={`$${metrics.lcoe.toFixed(3)}/kWh`}
          icon="⚡"
          tooltip="Average cost per kWh over project lifetime"
        />
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <SpecItem
          label="Total Investment"
          value={`$${project.targetAmount.toLocaleString()}`}
          description="Initial capital requirement"
        />
        <SpecItem
          label="Annual Revenue (Est.)"
          value={`$${metrics.annualRevenue.toLocaleString()}`}
          description="Expected yearly income"
        />
        <SpecItem
          label="Lifetime Value (25 yrs)"
          value={`$${(metrics.annualRevenue * 25).toLocaleString()}`}
          description="Total projected revenue"
        />
      </div>
    </div>
  );
}

/** WO-79: Investment Risk Assessment Section */
function InvestmentRiskAssessmentSection({ project }: any) {
  const riskAssessment = assessInvestmentRisks(project);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>⚠️</span> Investment Risk Assessment
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Risk Categories</h4>
          <div className="space-y-3">
            {riskAssessment.categories.map((cat, index) => (
              <RiskCategory key={index} {...cat} />
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Overall Risk Score</h4>
          <div className="text-center mb-6">
            <div className="text-5xl font-bold mb-2" style={{ color: getRiskScoreColor(riskAssessment.overallScore) }}>
              {riskAssessment.overallScore}/100
            </div>
            <div className="text-lg font-semibold text-gray-700">
              {riskAssessment.overallLevel}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Mitigation Strategies:</p>
            <ul className="space-y-1 text-xs text-gray-700">
              {riskAssessment.mitigations.map((mitigation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{mitigation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/** WO-79: Interactive Financial Modeling Section */
function InteractiveFinancialModelingSection({ project }: any) {
  const [electricityPrice, setElectricityPrice] = useState(0.12);
  const [capacityFactor, setCapacityFactor] = useState(0.25);
  const [discountRate, setDiscountRate] = useState(6);

  const modeledMetrics = calculateCustomROI(project, electricityPrice, capacityFactor, discountRate);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🧮</span> Interactive Financial Modeling
      </h3>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Adjust Parameters</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Electricity Price ($/kWh): ${electricityPrice.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.05"
                max="0.30"
                step="0.01"
                value={electricityPrice}
                onChange={(e) => setElectricityPrice(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity Factor: {(capacityFactor * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.10"
                max="0.50"
                step="0.01"
                value={capacityFactor}
                onChange={(e) => setCapacityFactor(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Rate: {discountRate}%
              </label>
              <input
                type="range"
                min="2"
                max="15"
                step="0.5"
                value={discountRate}
                onChange={(e) => setDiscountRate(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Updated Projections</h4>
          
          <div className="space-y-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Annual ROI</div>
              <div className="text-2xl font-bold text-green-600">{modeledMetrics.roi.toFixed(2)}%</div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Payback Period</div>
              <div className="text-2xl font-bold text-blue-600">{modeledMetrics.payback.toFixed(1)} years</div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Net Present Value</div>
              <div className="text-2xl font-bold text-purple-600">${modeledMetrics.npv.toLocaleString()}</div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-gray-600">Annual Revenue</div>
              <div className="text-2xl font-bold text-orange-600">${modeledMetrics.annualRevenue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** WO-79: Comparative Analysis Section */
function ComparativeAnalysisSection({ project }: any) {
  const benchmarks = {
    averageROI: 12.5,
    averagePayback: 8.2,
    averageLCOE: 0.085,
    averageCapacityFactor: 22.0,
  };

  const projectMetrics = calculateFinancialMetrics(project);

  const comparisonData = [
    {
      metric: 'ROI',
      'This Project': projectMetrics.irr,
      'Industry Average': benchmarks.averageROI,
    },
    {
      metric: 'Payback',
      'This Project': projectMetrics.paybackPeriod,
      'Industry Average': benchmarks.averagePayback,
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>📊</span> Comparative Analysis
      </h3>
      
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-4">vs Industry Benchmarks</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="This Project" fill="#10b981" />
            <Bar dataKey="Industry Average" fill="#6b7280" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ComparisonItem
          label="ROI Performance"
          projectValue={projectMetrics.irr}
          benchmarkValue={benchmarks.averageROI}
          unit="%"
        />
        <ComparisonItem
          label="Payback Period"
          projectValue={projectMetrics.paybackPeriod}
          benchmarkValue={benchmarks.averagePayback}
          unit=" years"
          lowerIsBetter
        />
        <ComparisonItem
          label="LCOE"
          projectValue={projectMetrics.lcoe}
          benchmarkValue={benchmarks.averageLCOE}
          unit=" $/kWh"
          lowerIsBetter
        />
      </div>
    </div>
  );
}

/** Helper Components */

function MetricCard({ label, value, icon, highlight, tooltip }: any) {
  return (
    <div className={`p-4 rounded-lg ${highlight ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </div>
      {tooltip && <div className="text-xs text-gray-500 mt-1">{tooltip}</div>}
    </div>
  );
}

function ScenarioCard({ title, roi, period, color, highlighted }: any) {
  return (
    <div className={`p-6 rounded-lg ${highlighted ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50 border border-gray-200'}`}>
      <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      <div className={`text-3xl font-bold ${color} mb-2`}>{roi.toFixed(2)}%</div>
      <div className="text-sm text-gray-600">Annual ROI</div>
      <div className="text-xs text-gray-500 mt-2">Over {period} years</div>
    </div>
  );
}

function RiskCategory({ category, level, probability, mitigation }: any) {
  const colorMap: any = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{category}</span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${colorMap[level]}`}>
          {level} Risk
        </span>
      </div>
      <div className="text-sm text-gray-600 mb-1">Probability: {probability}%</div>
      <div className="text-xs text-gray-500">{mitigation}</div>
    </div>
  );
}

function ComparisonItem({ label, projectValue, benchmarkValue, unit, lowerIsBetter }: any) {
  const performance = lowerIsBetter
    ? ((benchmarkValue - projectValue) / benchmarkValue) * 100
    : ((projectValue - benchmarkValue) / benchmarkValue) * 100;

  const isPositive = performance > 0;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-bold text-gray-900">
            {projectValue.toFixed(2)}{unit}
          </div>
          <div className="text-xs text-gray-500">
            vs {benchmarkValue.toFixed(2)}{unit} benchmark
          </div>
        </div>
        <div className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{performance.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function SpecItem({ label, value, description }: any) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="font-semibold text-gray-900 text-lg">{value}</div>
      {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
    </div>
  );
}

/** Financial Calculation Functions */

function calculateROIScenarios(project: any) {
  const capacity = project.energyCapacity || 0;
  
  return {
    conservative: {
      roi: (capacity * 8760 * 0.15 * 0.10 / project.targetAmount) * 100,
      years: 25,
    },
    expected: {
      roi: (capacity * 8760 * 0.25 * 0.12 / project.targetAmount) * 100,
      years: 25,
    },
    optimistic: {
      roi: (capacity * 8760 * 0.35 * 0.15 / project.targetAmount) * 100,
      years: 25,
    },
  };
}

function calculateFinancialMetrics(project: any) {
  const capacity = project.energyCapacity || 0;
  const annualProduction = capacity * 8760 * 0.25; // 25% capacity factor
  const electricityPrice = 0.12; // $0.12/kWh
  const annualRevenue = annualProduction * electricityPrice;
  const discountRate = 0.06;
  
  // NPV calculation (simplified)
  let npv = -project.targetAmount;
  for (let year = 1; year <= 25; year++) {
    npv += annualRevenue / Math.pow(1 + discountRate, year);
  }

  // IRR approximation
  const irr = (annualRevenue / project.targetAmount) * 100;

  // Payback period
  const paybackPeriod = project.targetAmount / annualRevenue;

  // LCOE calculation
  const totalCost = project.targetAmount + (annualRevenue * 0.02 * 25); // 2% O&M
  const totalEnergy = annualProduction * 25;
  const lcoe = totalCost / totalEnergy;

  return {
    npv,
    irr,
    paybackPeriod,
    lcoe,
    annualRevenue,
  };
}

function calculateCustomROI(project: any, price: number, cf: number, dr: number) {
  const capacity = project.energyCapacity || 0;
  const annualProduction = capacity * 8760 * cf;
  const annualRevenue = annualProduction * price;
  
  let npv = -project.targetAmount;
  for (let year = 1; year <= 25; year++) {
    npv += annualRevenue / Math.pow(1 + (dr / 100), year);
  }

  const roi = (annualRevenue / project.targetAmount) * 100;
  const payback = project.targetAmount / annualRevenue;

  return { roi, npv, payback, annualRevenue };
}

function assessInvestmentRisks(project: any) {
  const categories = [
    {
      category: 'Technology Risk',
      level: project.category === 'Solar' ? 'Low' : 'Medium',
      probability: project.category === 'Solar' ? 15 : 30,
      mitigation: 'Proven solar technology with 25-year track record',
    },
    {
      category: 'Market Risk',
      level: 'Low',
      probability: 20,
      mitigation: 'Long-term power purchase agreements in place',
    },
    {
      category: 'Execution Risk',
      level: project.creator.reputation > 700 ? 'Low' : 'Medium',
      probability: project.creator.reputation > 700 ? 25 : 40,
      mitigation: 'Experienced team with verified track record',
    },
    {
      category: 'Financial Risk',
      level: project.fundingProgress > 50 ? 'Low' : 'Medium',
      probability: project.fundingProgress > 50 ? 20 : 35,
      mitigation: 'Milestone-based funding with escrow protection',
    },
  ];

  const avgProbability = categories.reduce((sum, cat) => sum + cat.probability, 0) / categories.length;
  const overallScore = 100 - avgProbability;
  const overallLevel = overallScore > 70 ? 'Low Risk' : overallScore > 40 ? 'Moderate Risk' : 'High Risk';

  const mitigations = [
    'Milestone-based fund release ensures accountability',
    'Multi-oracle verification for energy production',
    'Community governance for major decisions',
    'Insurance coverage for equipment failure',
    'Diversified funding sources reduce dependency',
  ];

  return { categories, overallScore, overallLevel, mitigations };
}

function getRiskScoreColor(score: number): string {
  if (score > 70) return '#10b981'; // green
  if (score > 40) return '#f59e0b'; // orange
  return '#ef4444'; // red
}

function generateFundingTimeline(fundings: any[]) {
  const monthlyData: any = {};
  
  fundings.forEach(funding => {
    const month = new Date(funding.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    monthlyData[month] = (monthlyData[month] || 0) + funding.amount;
  });

  return Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount,
  })).slice(-6); // Last 6 months
}

