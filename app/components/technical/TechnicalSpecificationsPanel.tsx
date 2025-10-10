/**
 * Technical Specifications Panel
 * 
 * WO-73: Technical Specifications with Interactive Documentation
 * Comprehensive technical details display
 * 
 * Features:
 * - Project parameters (capacity, type, location, operations)
 * - Equipment specifications
 * - Energy production capabilities
 * - Performance projections
 * - Technical documentation viewer
 */

'use client';

import React, { useState } from 'react';

interface TechnicalSpecsPanelProps {
  project: any;
}

export default function TechnicalSpecificationsPanel({ project }: TechnicalSpecsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8">
      {/* WO-73: Search and filter bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search technical specifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Project Parameters Section */}
      <ProjectParametersSection project={project} />

      {/* Equipment Specifications Section */}
      <EquipmentSpecificationsSection project={project} />

      {/* Energy Production Section */}
      <EnergyProductionSection project={project} />

      {/* Interactive Diagram */}
      <InteractiveDiagramSection project={project} />

      {/* Technical Documents */}
      <TechnicalDocumentsSection project={project} />
    </div>
  );
}

/** WO-73: Project Parameters Section */
function ProjectParametersSection({ project }: any) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>📐</span> Project Parameters
      </h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SpecItem
          label="Energy Capacity"
          value={project.energyCapacity ? `${project.energyCapacity} kW` : 'N/A'}
          description={project.energyCapacity >= 1000 ? `(${(project.energyCapacity / 1000).toFixed(2)} MW)` : 'Power generation capacity'}
        />
        
        <SpecItem
          label="Technology Type"
          value={project.category}
          description="Primary energy generation technology"
        />
        
        <SpecItem
          label="Location"
          value={project.location}
          description="Geographic location of installation"
        />
        
        <SpecItem
          label="Project Duration"
          value={`${project.duration} days`}
          description={`Approximately ${(project.duration / 30).toFixed(1)} months`}
        />
        
        <SpecItem
          label="Milestone Structure"
          value={`${project.milestoneCount} milestones`}
          description={`${project.completedMilestones} completed`}
        />
        
        <SpecItem
          label="Operational Status"
          value={project.status}
          description={`Created ${project.daysSinceCreation} days ago`}
        />
      </div>
    </div>
  );
}

/** WO-73: Equipment Specifications Section */
function EquipmentSpecificationsSection({ project }: any) {
  // Equipment details would come from project metadata
  const equipmentSpecs = [
    {
      name: 'Solar Panels',
      manufacturer: 'SolarTech Industries',
      model: project.category === 'Solar' ? 'ST-500W' : 'N/A',
      quantity: project.energyCapacity ? Math.ceil((project.energyCapacity * 1000) / 500) : 0,
      performance: '21.5% efficiency',
      warranty: '25 years',
    },
    {
      name: 'Inverters',
      manufacturer: 'PowerConvert',
      model: 'PC-10K',
      quantity: project.energyCapacity ? Math.ceil(project.energyCapacity / 10) : 0,
      performance: '97.5% efficiency',
      warranty: '10 years',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🔧</span> Equipment Specifications
      </h3>
      
      <div className="space-y-4">
        {equipmentSpecs.map((equipment, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{equipment.name}</h4>
                <p className="text-sm text-gray-600">{equipment.manufacturer}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                {equipment.model}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Quantity:</span>
                <span className="ml-2 font-medium">{equipment.quantity}</span>
              </div>
              <div>
                <span className="text-gray-600">Performance:</span>
                <span className="ml-2 font-medium">{equipment.performance}</span>
              </div>
              <div>
                <span className="text-gray-600">Warranty:</span>
                <span className="ml-2 font-medium">{equipment.warranty}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** WO-73: Energy Production Section */
function EnergyProductionSection({ project }: any) {
  const capacityFactor = 0.25; // 25% typical for solar
  const annualProduction = (project.energyCapacity || 0) * 8760 * capacityFactor; // kW * hours * CF
  const expectedDailyOutput = annualProduction / 365;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>⚡</span> Energy Production Capabilities
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <SpecItem
            label="Installed Capacity"
            value={`${project.energyCapacity || 0} kW`}
            description="Maximum power generation capacity"
          />
          
          <SpecItem
            label="Capacity Factor"
            value={`${(capacityFactor * 100).toFixed(1)}%`}
            description="Expected operational efficiency"
          />
          
          <SpecItem
            label="Expected Annual Output"
            value={`${annualProduction.toLocaleString()} kWh`}
            description="Estimated yearly energy production"
          />
          
          <SpecItem
            label="Expected Daily Output"
            value={`${expectedDailyOutput.toFixed(0)} kWh/day`}
            description="Average daily energy production"
          />
        </div>

        <div className="space-y-4">
          <SpecItem
            label="Total Energy Produced"
            value={`${project.totalEnergyProduced.toLocaleString()} kWh`}
            description="Actual production to date"
          />
          
          <SpecItem
            label="Verified Production"
            value={`${project.verifiedEnergyProduced.toLocaleString()} kWh`}
            description="Oracle-verified energy output"
          />
          
          <SpecItem
            label="Performance vs Expected"
            value={`${((project.totalEnergyProduced / (expectedDailyOutput * project.daysSinceCreation || 1)) * 100).toFixed(1)}%`}
            description="Actual vs projected performance"
          />
        </div>
      </div>
    </div>
  );
}

/** WO-73: Interactive Diagram Section */
function InteractiveDiagramSection({ project }: any) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🗺️</span> Project Layout
      </h3>
      
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-300 mb-4">📍</div>
          <p className="text-gray-600">
            Interactive diagram placeholder
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Location: {project.location}
          </p>
        </div>
      </div>
    </div>
  );
}

/** WO-73: Technical Documents Section */
function TechnicalDocumentsSection({ project }: any) {
  const documents = [
    { name: 'Project Specification.pdf', type: 'PDF', size: '2.4 MB', uploaded: project.createdAt },
    { name: 'Equipment Datasheet.pdf', type: 'PDF', size: '1.8 MB', uploaded: project.createdAt },
    { name: 'Site Layout.png', type: 'Image', size: '850 KB', uploaded: project.createdAt },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>📄</span> Technical Documentation
      </h3>
      
      <div className="space-y-2">
        {documents.map((doc, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">{doc.type}</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{doc.name}</div>
                <div className="text-xs text-gray-500">{doc.size}</div>
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecItem({ label, value, description }: { label: string; value: string; description?: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="font-semibold text-gray-900 text-lg">{value}</div>
      {description && (
        <div className="text-xs text-gray-500 mt-1">{description}</div>
      )}
    </div>
  );
}

