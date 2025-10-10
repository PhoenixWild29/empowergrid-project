/**
 * Investment Calculator Component
 * 
 * WO-81: Investment Calculator with ROI Projections and Risk Assessment
 * 
 * Features:
 * - ROI projections with configurable rates
 * - Risk assessment (low/medium/high)
 * - Funding impact analysis
 * - Interactive modeling
 * - Comparative scenarios
 * - Investment recommendations
 */

'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface InvestmentCalculatorProps {
  project: {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    energyCapacity: number | null;
    duration: number;
    category: string;
    creator: {
      reputation: number;
    };
  };
}

export default function InvestmentCalculator({ project }: InvestmentCalculatorProps) {
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [interestRate, setInterestRate] = useState(12);
  const [timePeriod, setTimePeriod] = useState(5);
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');

  // WO-81: Calculate ROI projections
  const roiProjections = calculateROIProjections(investmentAmount, interestRate, timePeriod, project);
  
  // WO-81: Calculate risk assessment
  const riskAssessment = calculateRiskAssessment(investmentAmount, project);
  
  // WO-81: Calculate funding impact
  const fundingImpact = calculateFundingImpact(investmentAmount, project);
  
  // WO-81: Generate comparative scenarios
  const scenarios = generateScenarios(investmentAmount, project);
  
  // WO-81: Get investment recommendation
  const recommendation = getInvestmentRecommendation(investmentAmount, riskTolerance, project);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <span>🧮</span> Investment Calculator
      </h2>

      {/* Interactive Input Controls */}
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investment Amount: ${investmentAmount.toLocaleString()}
          </label>
          <input
            type="range"
            min="100"
            max={Math.min(project.targetAmount - project.currentAmount, 100000)}
            step="100"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Return Rate: {interestRate}%
          </label>
          <input
            type="range"
            min="5"
            max="25"
            step="0.5"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investment Period: {timePeriod} years
          </label>
          <input
            type="range"
            min="1"
            max="25"
            step="1"
            value={timePeriod}
            onChange={(e) => setTimePeriod(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* ROI Projections */}
      <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Projected Returns</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Return</div>
            <div className="text-3xl font-bold text-green-600">
              ${roiProjections.totalReturn.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">ROI</div>
            <div className="text-3xl font-bold text-blue-600">
              {roiProjections.roiPercentage.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Annual Return</div>
            <div className="text-3xl font-bold text-purple-600">
              ${roiProjections.annualReturn.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Payback Period</div>
            <div className="text-3xl font-bold text-orange-600">
              {roiProjections.paybackPeriod.toFixed(1)}y
            </div>
          </div>
        </div>

        {/* ROI Chart */}
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roiProjections.yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} name="Portfolio Value ($)" />
              <Line type="monotone" dataKey="returns" stroke="#3b82f6" strokeWidth={2} name="Cumulative Returns ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Risk Assessment</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className={`text-center p-6 rounded-lg ${
              riskAssessment.level === 'Low' ? 'bg-green-50 border-2 border-green-500' :
              riskAssessment.level === 'Medium' ? 'bg-yellow-50 border-2 border-yellow-500' :
              'bg-red-50 border-2 border-red-500'
            }`}>
              <div className="text-5xl mb-2">
                {riskAssessment.level === 'Low' ? '🟢' :
                 riskAssessment.level === 'Medium' ? '🟡' :
                 '🔴'}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {riskAssessment.level} Risk
              </div>
              <div className="text-sm text-gray-600">
                Score: {riskAssessment.score}/100
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Risk Factors</h4>
            <div className="space-y-2">
              {riskAssessment.factors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{factor.name}</span>
                  <span className={`text-sm font-medium ${
                    factor.level === 'Low' ? 'text-green-600' :
                    factor.level === 'Medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {factor.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Funding Impact Analysis */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Funding Impact</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Project Completion</div>
            <div className="text-2xl font-bold text-blue-600">
              {fundingImpact.completionImpact.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Accelerates by {fundingImpact.daysAccelerated} days
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Energy Contribution</div>
            <div className="text-2xl font-bold text-green-600">
              {fundingImpact.energyShare.toFixed(1)} kW
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {fundingImpact.annualEnergyProduction.toLocaleString()} kWh/year
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Milestones Unlocked</div>
            <div className="text-2xl font-bold text-purple-600">
              {fundingImpact.milestonesUnlocked}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Out of {project.duration / 30} total
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Scenarios */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Investment Scenarios</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scenarios}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="scenario" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="fiveYear" fill="#10b981" name="5-Year Return" />
              <Bar dataKey="tenYear" fill="#3b82f6" name="10-Year Return" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Investment Recommendation */}
      <div className={`p-6 rounded-lg border-2 ${recommendation.borderColor}`}>
        <div className="flex items-start gap-4">
          <div className="text-5xl">{recommendation.icon}</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{recommendation.title}</h3>
            <p className="text-gray-700 mb-4">{recommendation.message}</p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 mb-2">Recommended Amount:</div>
                <div className="text-2xl font-bold text-green-600">
                  ${recommendation.recommendedAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-2">Expected Return (5y):</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${recommendation.expectedReturn.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// WO-81: Calculation Functions

function calculateROIProjections(amount: number, rate: number, years: number, project: any) {
  const yearlyData = [];
  let totalValue = amount;

  for (let year = 0; year <= years; year++) {
    const returns = year > 0 ? totalValue * (rate / 100) : 0;
    totalValue = year === 0 ? amount : totalValue + returns;
    
    yearlyData.push({
      year: year === 0 ? 'Initial' : `Year ${year}`,
      value: Math.round(totalValue),
      returns: Math.round(totalValue - amount),
    });
  }

  const totalReturn = totalValue - amount;
  const roiPercentage = (totalReturn / amount) * 100;
  const annualReturn = totalReturn / years;
  const paybackPeriod = amount / annualReturn;

  return {
    totalReturn,
    roiPercentage,
    annualReturn,
    paybackPeriod,
    yearlyData,
  };
}

function calculateRiskAssessment(amount: number, project: any) {
  let score = 50; // Base score

  // Lower risk for smaller amounts
  if (amount < 1000) score += 15;
  else if (amount < 5000) score += 10;
  else if (amount > 20000) score -= 10;

  // Lower risk for established projects
  if (project.currentAmount / project.targetAmount > 0.5) score += 15;

  // Lower risk for high reputation creators
  if (project.creator.reputation > 800) score += 20;
  else if (project.creator.reputation > 500) score += 10;

  // Technology risk
  if (project.category === 'Solar') score += 10;

  score = Math.max(0, Math.min(100, score));

  const level = score > 70 ? 'Low' : score > 40 ? 'Medium' : 'High';

  const factors = [
    {
      name: 'Investment Size',
      level: amount < 5000 ? 'Low' : amount < 20000 ? 'Medium' : 'High'
    },
    {
      name: 'Project Funding Status',
      level: (project.currentAmount / project.targetAmount) > 0.5 ? 'Low' : 'Medium'
    },
    {
      name: 'Creator Track Record',
      level: project.creator.reputation > 700 ? 'Low' : 'Medium'
    },
    {
      name: 'Technology Maturity',
      level: project.category === 'Solar' ? 'Low' : 'Medium'
    },
  ];

  return { score, level, factors };
}

function calculateFundingImpact(amount: number, project: any) {
  const newTotal = project.currentAmount + amount;
  const completionImpact = (amount / project.targetAmount) * 100;
  
  // Estimate days accelerated
  const currentProgress = (project.currentAmount / project.targetAmount) * 100;
  const newProgress = (newTotal / project.targetAmount) * 100;
  const progressGain = newProgress - currentProgress;
  const daysAccelerated = Math.round((progressGain / 100) * project.duration);

  // Energy share
  const investmentShare = amount / project.targetAmount;
  const energyShare = (project.energyCapacity || 0) * investmentShare;
  const annualEnergyProduction = energyShare * 8760 * 0.25; // 25% capacity factor

  // Milestones unlocked
  const milestonesUnlocked = Math.floor((newProgress / 100) * (project.duration / 30)) - 
                             Math.floor((currentProgress / 100) * (project.duration / 30));

  return {
    completionImpact,
    daysAccelerated,
    energyShare,
    annualEnergyProduction,
    milestonesUnlocked: Math.max(0, milestonesUnlocked),
  };
}

function generateScenarios(baseAmount: number, project: any) {
  const amounts = [baseAmount * 0.5, baseAmount, baseAmount * 1.5];
  
  return amounts.map(amt => {
    const fiveYearReturn = amt * Math.pow(1.12, 5) - amt;
    const tenYearReturn = amt * Math.pow(1.12, 10) - amt;

    return {
      scenario: `$${amt.toLocaleString()}`,
      fiveYear: Math.round(fiveYearReturn),
      tenYear: Math.round(tenYearReturn),
    };
  });
}

function getInvestmentRecommendation(amount: number, riskTolerance: string, project: any) {
  const remaining = project.targetAmount - project.currentAmount;
  
  let recommendedAmount = amount;
  
  if (riskTolerance === 'low') {
    recommendedAmount = Math.min(1000, remaining);
  } else if (riskTolerance === 'medium') {
    recommendedAmount = Math.min(5000, remaining);
  } else {
    recommendedAmount = Math.min(20000, remaining);
  }

  const expectedReturn = recommendedAmount * Math.pow(1.12, 5) - recommendedAmount;

  let title, message, icon, borderColor;

  if (amount === recommendedAmount) {
    title = 'Optimal Investment';
    message = 'Your investment amount matches your risk tolerance and project needs.';
    icon = '✅';
    borderColor = 'border-green-500 bg-green-50';
  } else if (amount < recommendedAmount) {
    title = 'Consider Increasing';
    message = `Based on your ${riskTolerance} risk tolerance, you could invest up to $${recommendedAmount.toLocaleString()} for better returns.`;
    icon = '💡';
    borderColor = 'border-blue-500 bg-blue-50';
  } else {
    title = 'Higher Than Recommended';
    message = `This exceeds your ${riskTolerance} risk tolerance. Consider reducing or adjusting your risk profile.`;
    icon = '⚠️';
    borderColor = 'border-yellow-500 bg-yellow-50';
  }

  return {
    title,
    message,
    icon,
    borderColor,
    recommendedAmount,
    expectedReturn,
  };
}


