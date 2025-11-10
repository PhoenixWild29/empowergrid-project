import { nanoid } from 'nanoid';

export type ValidatorMilestoneStatus = 'PENDING' | 'IN_REVIEW' | 'NEEDS_INFO' | 'APPROVED' | 'FLAGGED';
export type ValidatorPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type DecisionType = 'COMMENT' | 'STATUS_CHANGE' | 'ASSIGNMENT';

export interface EvidenceItem {
  id: string;
  label: string;
  type: 'FILE' | 'LINK' | 'DATA_FEED';
  url?: string;
  checksum?: string;
}

export interface DecisionLogEntry {
  id: string;
  type: DecisionType;
  actor: string;
  message: string;
  createdAt: string;
}

export interface ValidatorMilestoneItem {
  id: string;
  projectId: string;
  projectName: string;
  milestoneName: string;
  requestedAmount: number;
  status: ValidatorMilestoneStatus;
  priority: ValidatorPriority;
  submittedAt: string;
  targetReleaseAt: string;
  slaHoursRemaining: number;
  location: string;
  technology: string;
  assignedValidators: string[];
  riskFlags: string[];
  evidence: EvidenceItem[];
  decisionLog: DecisionLogEntry[];
}

export interface ValidatorProfile {
  id: string;
  name: string;
  region: string;
  role: 'LEAD' | 'COMMUNITY' | 'TECHNICAL';
  loadPercentage: number;
  activeAssignments: number;
  specialties: string[];
  online: boolean;
}

const now = () => new Date().toISOString();

let milestones: ValidatorMilestoneItem[] = [
  {
    id: 'milestone-001',
    projectId: 'proj-101',
    projectName: 'Bronx Community Solar',
    milestoneName: 'Battery commissioning reports',
    requestedAmount: 42000,
    status: 'IN_REVIEW',
    priority: 'HIGH',
    submittedAt: '2025-06-02T11:20:00.000Z',
    targetReleaseAt: '2025-06-09T00:00:00.000Z',
    slaHoursRemaining: 22,
    location: 'Bronx, NY',
    technology: 'Solar + Storage',
    assignedValidators: ['validator-001', 'validator-003'],
    riskFlags: ['Missing inverter serial metadata'],
    evidence: [
      { id: nanoid(), label: 'Commissioning report.pdf', type: 'FILE', url: '/evidence/bronx/report.pdf', checksum: 'sha256-f1a' },
      { id: nanoid(), label: 'Telemetry feed', type: 'DATA_FEED', url: 'https://solana.fm/oracle/bronx-feed' },
    ],
    decisionLog: [
      {
        id: nanoid(),
        type: 'COMMENT',
        actor: 'Marina Gomez',
        message: 'Initial evidence uploaded. Need inverter serials for cross-check.',
        createdAt: '2025-06-02T12:00:00.000Z',
      },
      {
        id: nanoid(),
        type: 'ASSIGNMENT',
        actor: 'System',
        message: 'Assigned to ClearGrid Auditors (engineering) and Bronx Energy Coop (community).',
        createdAt: '2025-06-02T12:05:00.000Z',
      },
    ],
  },
  {
    id: 'milestone-002',
    projectId: 'proj-142',
    projectName: 'Lagos Microgrid Expansion',
    milestoneName: 'Community training completion',
    requestedAmount: 18500,
    status: 'NEEDS_INFO',
    priority: 'MEDIUM',
    submittedAt: '2025-06-01T08:05:00.000Z',
    targetReleaseAt: '2025-06-12T00:00:00.000Z',
    slaHoursRemaining: -5,
    location: 'Lagos, NG',
    technology: 'Microgrid',
    assignedValidators: ['validator-002'],
    riskFlags: ['SLA breach'],
    evidence: [
      { id: nanoid(), label: 'Training roster.csv', type: 'FILE' },
      { id: nanoid(), label: 'Community testimonial video', type: 'LINK', url: 'https://stream.empowergrid.org/watch/lagos-training' },
    ],
    decisionLog: [
      {
        id: nanoid(),
        type: 'STATUS_CHANGE',
        actor: 'Tayo Akanbi',
        message: 'Requested additional attendance proofs for cohort 2. Holding release.',
        createdAt: '2025-06-03T09:10:00.000Z',
      },
    ],
  },
  {
    id: 'milestone-003',
    projectId: 'proj-098',
    projectName: 'Yucatán Solar Schools',
    milestoneName: 'Sensor calibration logs',
    requestedAmount: 26500,
    status: 'APPROVED',
    priority: 'LOW',
    submittedAt: '2025-05-30T17:40:00.000Z',
    targetReleaseAt: '2025-06-06T00:00:00.000Z',
    slaHoursRemaining: 96,
    location: 'Mérida, MX',
    technology: 'Solar',
    assignedValidators: ['validator-001'],
    riskFlags: [],
    evidence: [
      { id: nanoid(), label: 'Calibration logs.json', type: 'FILE' },
    ],
    decisionLog: [
      {
        id: nanoid(),
        type: 'STATUS_CHANGE',
        actor: 'Sofia Hernandez',
        message: 'Milestone approved. Escrow release scheduled.',
        createdAt: '2025-06-01T10:15:00.000Z',
      },
    ],
  },
];

let validators: ValidatorProfile[] = [
  {
    id: 'validator-001',
    name: 'ClearGrid Auditors',
    region: 'North America',
    role: 'LEAD',
    loadPercentage: 62,
    activeAssignments: 4,
    specialties: ['Solar', 'Storage'],
    online: true,
  },
  {
    id: 'validator-002',
    name: 'SolarGuard Africa',
    region: 'West Africa',
    role: 'COMMUNITY',
    loadPercentage: 85,
    activeAssignments: 6,
    specialties: ['Community Training', 'Microgrids'],
    online: false,
  },
  {
    id: 'validator-003',
    name: 'GridPulse Engineering',
    region: 'Global',
    role: 'TECHNICAL',
    loadPercentage: 48,
    activeAssignments: 3,
    specialties: ['Instrumentation', 'Telemetry'],
    online: true,
  },
];

export const validatorHubStore = {
  listMilestones() {
    return milestones;
  },
  listValidators() {
    return validators;
  },
  updateMilestoneStatus(id: string, status: ValidatorMilestoneStatus, actor: string, message?: string) {
    const target = milestones.find(milestone => milestone.id === id);
    if (!target) return null;

    target.status = status;
    target.decisionLog.unshift({
      id: nanoid(),
      type: 'STATUS_CHANGE',
      actor,
      message: message ?? `Status updated to ${status.toLowerCase()}.`,
      createdAt: now(),
    });
    return target;
  },
  requestInformation(id: string, actor: string, message: string) {
    return this.updateMilestoneStatus(id, 'NEEDS_INFO', actor, message);
  },
  addComment(id: string, actor: string, message: string) {
    const target = milestones.find(milestone => milestone.id === id);
    if (!target) return null;
    target.decisionLog.unshift({
      id: nanoid(),
      type: 'COMMENT',
      actor,
      message,
      createdAt: now(),
    });
    return target;
  },
  assignValidator(milestoneId: string, validatorId: string, actor: string) {
    const milestone = milestones.find(item => item.id === milestoneId);
    const validator = validators.find(item => item.id === validatorId);
    if (!milestone || !validator) return null;

    if (!milestone.assignedValidators.includes(validatorId)) {
      milestone.assignedValidators.push(validatorId);
      validator.activeAssignments += 1;
      validator.loadPercentage = Math.min(100, validator.loadPercentage + 6);
      milestone.decisionLog.unshift({
        id: nanoid(),
        type: 'ASSIGNMENT',
        actor,
        message: `Assigned ${validator.name} to milestone.`,
        createdAt: now(),
      });
    }
    return milestone;
  },
};

export default validatorHubStore;
