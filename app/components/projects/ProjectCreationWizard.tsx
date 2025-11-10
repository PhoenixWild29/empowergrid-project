import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { distributeMilestoneBudgets } from '../../lib/utils/milestoneBudget';

type WizardStep = 'details' | 'energy' | 'funding' | 'milestones' | 'review';

type VerificationType = 'COMMUNITY' | 'ENGINEERING' | 'ENVIRONMENTAL';

type FundingCurrency = 'USDC' | 'SOL';

type ProjectDraftMilestone = {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  dueDate: string;
  evidenceCriteria: string;
  verificationType: VerificationType;
};

interface ProjectDraft {
  title: string;
  description: string;
  category: string;
  tags: string[];
  location?: string;
  impactNarrative?: string;
  energyCapacity?: number;
  energyType?: string;
  certifications?: string[];
  targetAmount: number;
  currency: FundingCurrency;
  duration: number;
  milestoneCount: number;
  milestones: ProjectDraftMilestone[];
  evidencePolicyAcknowledged: boolean;
}

interface StepConfig {
  title: string;
  description: string;
  tips: string[];
  checklist: string[];
}

const STORAGE_KEY = 'project_draft';

const envNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const MIN_TARGET = envNumber(
  process.env.NEXT_PUBLIC_WIZARD_MIN_TARGET_USD ?? process.env.WIZARD_MIN_TARGET_USD,
  1000
);
const MAX_TARGET = envNumber(
  process.env.NEXT_PUBLIC_WIZARD_MAX_TARGET_USD ?? process.env.WIZARD_MAX_TARGET_USD,
  10000000
);
const MIN_DURATION = envNumber(
  process.env.NEXT_PUBLIC_WIZARD_MIN_DURATION_DAYS ?? process.env.WIZARD_MIN_DURATION_DAYS,
  30
);
const MAX_DURATION = envNumber(
  process.env.NEXT_PUBLIC_WIZARD_MAX_DURATION_DAYS ?? process.env.WIZARD_MAX_DURATION_DAYS,
  540
);

const DEFAULT_MILESTONE_COUNT = 3;

const STEP_CONFIG: Record<WizardStep, StepConfig> = {
  details: {
    title: 'Project Blueprint',
    description: 'Define the headline story investors and validators will read first.',
    tips: [
      'Lead with community impact and quantifiable benefits.',
      'Keep location formatted as City, Region for validator lookups.',
      'Use tags that match marketplace filters (technology, geography, impact).',
    ],
    checklist: [
      'Title is at least 10 characters',
      'Impact statement is at least 150 characters',
      'Category and minimum one tag selected',
    ],
  },
  energy: {
    title: 'Energy Profile',
    description: 'Capture the technical specs validators will verify on-chain.',
    tips: [
      'Capacity should represent steady-state output (kW).',
      'Energy mix helps drive tailored validator assignments.',
      'Certifications improve investor trust and validator prioritization.',
    ],
    checklist: [
      'Capacity within expected range for asset type',
      'Energy type selected',
      'Optional certifications documented',
    ],
  },
  funding: {
    title: 'Funding Strategy',
    description: 'Set the raise parameters aligned with escrow policy and ROI goals.',
    tips: [
      'Escrow releases must align with milestone structure.',
      'Durations outside policy windows require additional validator review.',
      'Currency choice affects downstream settlement (USDC recommended).',
    ],
    checklist: [
      `Target between ${MIN_TARGET.toLocaleString()} and ${MAX_TARGET.toLocaleString()} USD`,
      `Duration between ${MIN_DURATION} and ${MAX_DURATION} days`,
      'Currency aligns with escrow configuration',
    ],
  },
  milestones: {
    title: 'Milestone Builder',
    description: 'Design validator-ready milestones that unlock escrowed funds.',
    tips: [
      'Auto-distribute budgets, then fine-tune amounts and due dates.',
      'Evidence criteria should describe exactly what validators must review.',
      'Due dates must be chronological and at least 1 week out.',
    ],
    checklist: [
      'Milestone count 1-10',
      'Sum of payouts matches funding target',
      'All due dates and verification criteria provided',
    ],
  },
  review: {
    title: 'Review & Submit',
    description: 'Confirm everything looks right before sending for validator review.',
    tips: [
      'Download a JSON backup for your records.',
      'Copy summary for stakeholder updates.',
      'Use simulation preview to ensure milestone cadence feels realistic.',
    ],
    checklist: [
      'All previous checks green',
      'Evidence policy acknowledged',
      'No validation errors remaining',
    ],
  },
};

const roundToCents = (value: number) => Math.round(value * 100) / 100;

interface CreateMilestonesOptions {
  preserveAmounts?: boolean;
}

const createDefaultMilestones = (
  total: number,
  count: number,
  existing?: ProjectDraftMilestone[],
  options: CreateMilestonesOptions = {}
): ProjectDraftMilestone[] => {
  const suggestions = distributeMilestoneBudgets(
    total,
    count,
    existing?.map(milestone => milestone.title)
  );

  return suggestions.map((suggestion, index) => {
    const previous = existing?.[index];
    const preserve = options.preserveAmounts ?? false;
    const amount = preserve && Number.isFinite(previous?.targetAmount)
      ? previous!.targetAmount
      : suggestion.amount;

    return {
      id: previous?.id ?? `milestone-${index}-${Date.now()}`,
      title: previous?.title ?? suggestion.title,
      description: previous?.description ?? '',
      targetAmount: roundToCents(amount),
      dueDate: previous?.dueDate ?? '',
      evidenceCriteria: previous?.evidenceCriteria ?? '',
      verificationType: previous?.verificationType ?? 'COMMUNITY',
    } satisfies ProjectDraftMilestone;
  });
};

const getMilestoneTotal = (milestones: ProjectDraftMilestone[]) =>
  roundToCents(milestones.reduce((sum, milestone) => sum + (milestone.targetAmount || 0), 0));

const ProjectCreationWizard = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [autoDistributeBudgets, setAutoDistributeBudgets] = useState(true);
  const [simulationSummary, setSimulationSummary] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<ProjectDraft>(() => {
    const draft: ProjectDraft = {
      title: '',
      description: '',
      category: '',
      tags: [],
      location: '',
      impactNarrative: '',
      energyCapacity: undefined,
      energyType: '',
      certifications: [],
      targetAmount: MIN_TARGET,
      currency: 'USDC',
      duration: Math.min(Math.max(MIN_DURATION, 90), MAX_DURATION),
      milestoneCount: DEFAULT_MILESTONE_COUNT,
      milestones: createDefaultMilestones(MIN_TARGET, DEFAULT_MILESTONE_COUNT),
      evidencePolicyAcknowledged: false,
    };

    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return {
            ...draft,
            ...parsed,
            milestones: createDefaultMilestones(
              parsed.targetAmount ?? draft.targetAmount,
              parsed.milestoneCount ?? draft.milestoneCount,
              parsed.milestones,
              { preserveAmounts: true }
            ),
          };
        } catch (error) {
          console.error('[wizard] failed to parse stored draft', error);
        }
      }
    }

    return draft;
  });

  const steps: WizardStep[] = ['details', 'energy', 'funding', 'milestones', 'review'];
  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }, 300);

    return () => window.clearTimeout(id);
  }, [formData]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      milestones: createDefaultMilestones(
        prev.targetAmount,
        prev.milestoneCount,
        prev.milestones,
        { preserveAmounts: true }
      ),
    }));
  }, []);

  useEffect(() => {
    if (!autoDistributeBudgets) return;
    setFormData(prev => ({
      ...prev,
      milestones: createDefaultMilestones(
        prev.targetAmount,
        prev.milestoneCount,
        prev.milestones,
        { preserveAmounts: false }
      ),
    }));
  }, [autoDistributeBudgets, formData.targetAmount, formData.milestoneCount]);

  useEffect(() => {
    setFormData(prev => {
      if (prev.milestones.length === prev.milestoneCount) {
        return prev;
      }
      return {
        ...prev,
        milestones: createDefaultMilestones(
          prev.targetAmount,
          prev.milestoneCount,
          prev.milestones,
          { preserveAmounts: !autoDistributeBudgets }
        ),
      };
    });
  }, [formData.milestoneCount, autoDistributeBudgets]);

  const milestoneTotal = useMemo(() => getMilestoneTotal(formData.milestones), [formData.milestones]);
  const milestoneVariance = useMemo(
    () => roundToCents(milestoneTotal - roundToCents(formData.targetAmount)),
    [milestoneTotal, formData.targetAmount]
  );

  const validateStep = useCallback(
    (step: WizardStep): boolean => {
      const newErrors: Record<string, string> = {};

      if (step === 'details') {
        if (!formData.title || formData.title.trim().length < 10) {
          newErrors.title = 'Title must be at least 10 characters.';
        }
        if (!formData.description || formData.description.trim().length < 150) {
          newErrors.description = 'Description must be at least 150 characters.';
        }
        if (!formData.category) {
          newErrors.category = 'Select a category to continue.';
        }
        if (!formData.tags || formData.tags.length === 0) {
          newErrors.tags = 'Add at least one tag.';
        }
      }

      if (step === 'funding') {
        if (formData.targetAmount < MIN_TARGET) {
          newErrors.targetAmount = `Target must be at least ${MIN_TARGET.toLocaleString()} USD.`;
        }
        if (formData.targetAmount > MAX_TARGET) {
          newErrors.targetAmount = `Target cannot exceed ${MAX_TARGET.toLocaleString()} USD.`;
        }
        if (formData.duration < MIN_DURATION) {
          newErrors.duration = `Duration must be at least ${MIN_DURATION} days.`;
        }
        if (formData.duration > MAX_DURATION) {
          newErrors.duration = `Duration cannot exceed ${MAX_DURATION} days.`;
        }
      }

      if (step === 'milestones') {
        if (formData.milestoneCount < 1 || formData.milestoneCount > 10) {
          newErrors.milestoneCount = 'Milestone count must be between 1 and 10.';
        }
        if (Math.abs(milestoneVariance) > 0.5) {
          newErrors.milestoneVariance = 'Milestone payouts must match total target.';
        }

        const sorted = [...formData.milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        formData.milestones.forEach((milestone, index) => {
          if (!milestone.title || milestone.title.trim().length < 4) {
            newErrors[`milestone-title-${index}`] = 'Provide a descriptive milestone title.';
          }
          if (!milestone.description || milestone.description.trim().length < 30) {
            newErrors[`milestone-description-${index}`] = 'Describe the milestone in at least 30 characters.';
          }
          if (!milestone.evidenceCriteria || milestone.evidenceCriteria.trim().length < 25) {
            newErrors[`milestone-evidence-${index}`] = 'Evidence requirements must be at least 25 characters.';
          }
          if (!milestone.dueDate) {
            newErrors[`milestone-dueDate-${index}`] = 'Provide an expected completion date.';
          } else {
            const due = new Date(milestone.dueDate);
            if (!Number.isFinite(due.getTime())) {
              newErrors[`milestone-dueDate-${index}`] = 'Due date must be a valid date.';
            } else {
              const minDate = new Date();
              minDate.setDate(minDate.getDate() + 7);
              if (due < minDate) {
                newErrors[`milestone-dueDate-${index}`] = 'Due date must be at least 7 days in the future.';
              }
            }
          }
        });

        if (JSON.stringify(sorted.map(milestone => milestone.id)) !== JSON.stringify(formData.milestones.map(milestone => milestone.id))) {
          newErrors.milestoneOrdering = 'Reorder milestones by due date to maintain chronology.';
        }
      }

      if (step === 'review') {
        if (!formData.evidencePolicyAcknowledged) {
          newErrors.evidencePolicyAcknowledged = 'Acknowledge the evidence policy before submission.';
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData, milestoneVariance]
  );

  const goToStep = (target: WizardStep) => {
    if (steps.indexOf(target) <= currentIndex && target !== currentStep) {
      setCurrentStep(target);
      setErrors({});
      return;
    }

    if (validateStep(currentStep)) {
      setCurrentStep(target);
      setErrors({});
    }
  };

  const goToNextStep = () => {
    if (!validateStep(currentStep)) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
      setErrors({});
    }
  };

  const goToPreviousStep = () => {
    if (currentIndex === 0) return;
    setCurrentStep(steps[currentIndex - 1]);
    setErrors({});
  };

  const updateMilestone = (index: number, patch: Partial<ProjectDraftMilestone>) => {
    setFormData(prev => {
      const milestones = [...prev.milestones];
      milestones[index] = {
        ...milestones[index],
        ...patch,
      };
      return {
        ...prev,
        milestones,
      };
    });
  };

  const handleSubmit = async () => {
    if (!validateStep('review')) return;
    setSaving(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const payload = await response.json();
        const newErrors: Record<string, string> = {};

        if (payload?.details) {
          payload.details.forEach((detail: { field: string; message: string }) => {
            newErrors[detail.field] = detail.message;
          });
        } else if (payload?.error) {
          newErrors.general = payload.error;
        } else {
          newErrors.general = 'Failed to submit project. Please try again later.';
        }

        setErrors(newErrors);
        setCurrentStep('details');
        return;
      }

      const data = await response.json();
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      router.push(`/projects/${data.project.id}`);
    } catch (error) {
      console.error('[wizard] submit error', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDraft = () => {
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `empowergrid-project-draft-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = async () => {
    try {
      const summary = [
        `Project: ${formData.title}`,
        formData.location ? `Location: ${formData.location}` : undefined,
        `Category: ${formData.category}`,
        `Tags: ${formData.tags.join(', ')}`,
        '',
        `Target: ${formData.targetAmount.toLocaleString()} ${formData.currency}`,
        `Duration: ${formData.duration} days`,
        '',
        'Milestones:',
        ...formData.milestones.map((milestone, index) =>
          `${index + 1}. ${milestone.title} – ${milestone.targetAmount.toLocaleString()} ${formData.currency} – due ${milestone.dueDate || 'TBD'}`
        ),
      ]
        .filter(Boolean)
        .join('\n');

      await navigator.clipboard.writeText(summary);
      setSimulationSummary('Summary copied to clipboard.');
      setTimeout(() => setSimulationSummary(null), 4000);
    } catch (error) {
      console.error('[wizard] copy summary failed', error);
    }
  };

  const runSimulation = () => {
    const cadence = formData.milestones
      .map(milestone => ({
        label: milestone.title,
        payout: milestone.targetAmount,
      }))
      .reduce<{ label: string; payout: number; cumulative: number }[]>((acc, item, index) => {
        const previous = acc[index - 1]?.cumulative ?? 0;
        acc.push({ label: item.label, payout: item.payout, cumulative: previous + item.payout });
        return acc;
      }, []);

    const total = cadence[cadence.length - 1]?.cumulative ?? 0;
    const lines = cadence.map(entry => `• ${entry.label}: ${entry.payout.toLocaleString()} (${entry.cumulative.toLocaleString()} cumulative)`);
    setSimulationSummary(`Escrow release cadence (${formData.currency}):\n${lines.join('\n')}\nTotal: ${total.toLocaleString()}`);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                Project title
                <span className="text-xs font-normal text-slate-500">{formData.title.length}/200</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={event =>
                  setFormData(prev => ({ ...prev, title: event.target.value.slice(0, 200) }))
                }
                className={clsx(
                  'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none',
                  errors.title && 'border-red-400 focus:border-red-400'
                )}
                placeholder="Community solar farm lighting three villages"
              />
              {errors.title && <p className="mt-2 text-sm text-red-500">{errors.title}</p>}
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                Impact narrative
                <span className="text-xs font-normal text-slate-500">{formData.description.length}/5000</span>
              </label>
              <textarea
                value={formData.description}
                onChange={event =>
                  setFormData(prev => ({ ...prev, description: event.target.value.slice(0, 5000) }))
                }
                rows={6}
                className={clsx(
                  'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base leading-6 shadow-sm focus:border-emerald-400 focus:outline-none',
                  errors.description && 'border-red-400 focus:border-red-400'
                )}
                placeholder="Explain the community benefit, technology readiness, and partners involved."
              />
              {errors.description && <p className="mt-2 text-sm text-red-500">{errors.description}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <select
                  value={formData.category}
                  onChange={event =>
                    setFormData(prev => ({ ...prev, category: event.target.value }))
                  }
                  className={clsx(
                    'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none',
                    errors.category && 'border-red-400 focus:border-red-400'
                  )}
                >
                  <option value="">Select category…</option>
                  <option value="Solar">Solar</option>
                  <option value="Wind">Wind</option>
                  <option value="Hydro">Hydro</option>
                  <option value="Geothermal">Geothermal</option>
                  <option value="Biomass">Biomass</option>
                </select>
                {errors.category && <p className="mt-2 text-sm text-red-500">{errors.category}</p>}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Location</label>
                <input
                  type="text"
                  value={formData.location ?? ''}
                  onChange={event =>
                    setFormData(prev => ({ ...prev, location: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="City, Region"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Tags</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    tags: event.target.value
                      .split(',')
                      .map(tag => tag.trim())
                      .filter(Boolean),
                  }))
                }
                className={clsx(
                  'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none',
                  errors.tags && 'border-red-400 focus:border-red-400'
                )}
                placeholder="solar, microgrid, community"
              />
              <p className="mt-2 text-sm text-slate-500">Separate tags with commas.</p>
              {errors.tags && <p className="mt-2 text-sm text-red-500">{errors.tags}</p>}
            </div>
          </div>
        );

      case 'energy':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Capacity (kW)</label>
                <input
                  type="number"
                  value={formData.energyCapacity ?? ''}
                  onChange={event =>
                    setFormData(prev => ({
                      ...prev,
                      energyCapacity: Number(event.target.value),
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="500"
                />
                <p className="mt-2 text-sm text-slate-500">Range: 1 – 10,000 kW.</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Energy mix</label>
                <select
                  value={formData.energyType ?? ''}
                  onChange={event =>
                    setFormData(prev => ({ ...prev, energyType: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">Select type…</option>
                  <option value="photovoltaic">Photovoltaic Solar</option>
                  <option value="agrivoltaic">Agrivoltaic Solar</option>
                  <option value="wind">Onshore Wind</option>
                  <option value="hydro">Run-of-river Hydro</option>
                  <option value="geothermal">Geothermal</option>
                  <option value="biomass">Biomass</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Certifications (optional)</label>
              <input
                type="text"
                value={(formData.certifications ?? []).join(', ')}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    certifications: event.target.value
                      .split(',')
                      .map(cert => cert.trim())
                      .filter(Boolean),
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none"
                placeholder="ISO 9001, UN SDG 7"
              />
              <p className="mt-2 text-sm text-slate-500">Comma-separated list of standards or certifications.</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Impact narrative (optional)</label>
              <textarea
                value={formData.impactNarrative ?? ''}
                onChange={event =>
                  setFormData(prev => ({ ...prev, impactNarrative: event.target.value }))
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base leading-6 shadow-sm focus:border-emerald-400 focus:outline-none"
                placeholder="Share the broader community impact indicators or SDG alignment."
              />
            </div>
          </div>
        );

      case 'funding':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Funding currency</label>
                <select
                  value={formData.currency}
                  onChange={event =>
                    setFormData(prev => ({
                      ...prev,
                      currency: event.target.value as FundingCurrency,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none"
                >
                  <option value="USDC">USDC (recommended)</option>
                  <option value="SOL">SOL</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Funding target ({formData.currency})</label>
                <input
                  type="number"
                  value={formData.targetAmount}
                  onChange={event =>
                    setFormData(prev => ({
                      ...prev,
                      targetAmount: Number(event.target.value),
                    }))
                  }
                  className={clsx(
                    'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none',
                    errors.targetAmount && 'border-red-400 focus:border-red-400'
                  )}
                  min={MIN_TARGET}
                  max={MAX_TARGET}
                />
                <p className="mt-2 text-sm text-slate-500">
                  {MIN_TARGET.toLocaleString()} – {MAX_TARGET.toLocaleString()} {formData.currency}
                </p>
                {errors.targetAmount && <p className="mt-2 text-sm text-red-500">{errors.targetAmount}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Raise duration (days)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    duration: Number(event.target.value),
                  }))
                }
                className={clsx(
                  'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none',
                  errors.duration && 'border-red-400 focus:border-red-400'
                )}
                min={MIN_DURATION}
                max={MAX_DURATION}
              />
              <p className="mt-2 text-sm text-slate-500">
                {MIN_DURATION} – {MAX_DURATION} days. Longer raises require validator approval.
              </p>
              {errors.duration && <p className="mt-2 text-sm text-red-500">{errors.duration}</p>}
            </div>

            <div className="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">ROI hint</p>
              <p className="mt-1">
                Based on similar projects, a {formData.duration}-day raise often targets a {analyzeYield(formData.duration)}% annualized yield.
                Adjust milestone cadence to keep validator load balanced.
              </p>
            </div>
          </div>
        );

      case 'milestones':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Milestone count</p>
                <p className="mt-1 text-sm text-slate-500">Split your escrow release schedule.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      milestoneCount: Math.max(1, prev.milestoneCount - 1),
                    }))
                  }
                  className="rounded-full border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-600"
                >
                  −
                </button>
                <input
                  type="number"
                  value={formData.milestoneCount}
                  onChange={event =>
                    setFormData(prev => ({
                      ...prev,
                      milestoneCount: Number(event.target.value),
                    }))
                  }
                  className={clsx(
                    'w-20 rounded-2xl border border-slate-200 px-3 py-2 text-center text-base focus:border-emerald-400 focus:outline-none',
                    errors.milestoneCount && 'border-red-400 focus:border-red-400'
                  )}
                  min={1}
                  max={10}
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      milestoneCount: Math.min(10, prev.milestoneCount + 1),
                    }))
                  }
                  className="rounded-full border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-600"
                >
                  +
                </button>
              </div>
            </div>
            {errors.milestoneCount && <p className="text-sm text-red-500">{errors.milestoneCount}</p>}

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={autoDistributeBudgets}
                onChange={event => setAutoDistributeBudgets(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Auto-distribute budgets when the target changes
            </label>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Payout sum:{' '}
                  <span className="font-semibold text-slate-900">
                    {milestoneTotal.toLocaleString()} {formData.currency}
                  </span>
                </span>
                <span
                  className={clsx(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    Math.abs(milestoneVariance) <= 0.5
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {Math.abs(milestoneVariance) <= 0.5
                    ? 'Balanced'
                    : `Adjust by ${Math.abs(milestoneVariance).toFixed(2)} ${formData.currency}`}
                </span>
              </div>
            </div>
            {errors.milestoneVariance && <p className="text-sm text-red-500">{errors.milestoneVariance}</p>}
            {errors.milestoneOrdering && <p className="text-sm text-amber-600">{errors.milestoneOrdering}</p>}

            <div className="space-y-6">
              {formData.milestones.map((milestone, index) => (
                <div key={milestone.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">Milestone {index + 1}</h3>
                    <select
                      value={milestone.verificationType}
                      onChange={event =>
                        updateMilestone(index, {
                          verificationType: event.target.value as VerificationType,
                        })
                      }
                      className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      <option value="COMMUNITY">Community validator</option>
                      <option value="ENGINEERING">Engineering validator</option>
                      <option value="ENVIRONMENTAL">Environmental validator</option>
                    </select>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Title</label>
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={event =>
                          updateMilestone(index, { title: event.target.value.slice(0, 120) })
                        }
                        className={clsx(
                          'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none',
                          errors[`milestone-title-${index}`] && 'border-red-400 focus:border-red-400'
                        )}
                        placeholder="Install rooftop arrays"
                      />
                      {errors[`milestone-title-${index}`] && (
                        <p className="mt-2 text-sm text-red-500">{errors[`milestone-title-${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">Due date</label>
                      <input
                        type="date"
                        value={milestone.dueDate}
                        onChange={event => updateMilestone(index, { dueDate: event.target.value })}
                        className={clsx(
                          'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none',
                          errors[`milestone-dueDate-${index}`] && 'border-red-400 focus:border-red-400'
                        )}
                      />
                      {errors[`milestone-dueDate-${index}`] && (
                        <p className="mt-2 text-sm text-red-500">{errors[`milestone-dueDate-${index}`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700">Milestone description</label>
                    <textarea
                      value={milestone.description}
                      onChange={event =>
                        updateMilestone(index, { description: event.target.value.slice(0, 2000) })
                      }
                      rows={3}
                      className={clsx(
                        'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base leading-6 shadow-sm focus:border-emerald-400 focus:outline-none',
                        errors[`milestone-description-${index}`] && 'border-red-400 focus:border-red-400'
                      )}
                      placeholder="Outline the deliverables validators will review."
                    />
                    {errors[`milestone-description-${index}`] && (
                      <p className="mt-2 text-sm text-red-500">{errors[`milestone-description-${index}`]}</p>
                    )}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Evidence requirements</label>
                      <textarea
                        value={milestone.evidenceCriteria}
                        onChange={event =>
                          updateMilestone(index, {
                            evidenceCriteria: event.target.value.slice(0, 2000),
                          })
                        }
                        rows={3}
                        className={clsx(
                          'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base leading-6 shadow-sm focus:border-emerald-400 focus:outline-none',
                          errors[`milestone-evidence-${index}`] && 'border-red-400 focus:border-red-400'
                        )}
                        placeholder="Upload photos, inverter readings, permits, validator checklist, etc."
                      />
                      {errors[`milestone-evidence-${index}`] && (
                        <p className="mt-2 text-sm text-red-500">{errors[`milestone-evidence-${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">
                        Payout ({formData.currency})
                      </label>
                      <input
                        type="number"
                        value={milestone.targetAmount}
                        onChange={event =>
                          updateMilestone(index, {
                            targetAmount: Number(event.target.value),
                          })
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none"
                        min={0}
                      />
                      <p className="mt-2 text-sm text-slate-500">
                        Adjust to incentivize progress. Remaining variance: {Math.abs(milestoneVariance).toFixed(2)} {formData.currency}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-8">
            {errors.general && (
              <div className="rounded-3xl bg-red-50 p-4 text-sm text-red-700">{errors.general}</div>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Project Overview</h3>
                <button
                  type="button"
                  onClick={() => goToStep('details')}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Edit
                </button>
              </header>
              <dl className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
                <div>
                  <dt className="font-semibold text-slate-700">Title</dt>
                  <dd className="mt-1 text-slate-900">{formData.title}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Category</dt>
                  <dd className="mt-1 text-slate-900">{formData.category}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Location</dt>
                  <dd className="mt-1 text-slate-900">{formData.location || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Tags</dt>
                  <dd className="mt-1 text-slate-900">{formData.tags.join(', ')}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-slate-600">{formData.description}</p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Funding & Cadence</h3>
                <button
                  type="button"
                  onClick={() => goToStep('funding')}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Edit
                </button>
              </header>
              <dl className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
                <div>
                  <dt className="font-semibold text-slate-700">Target</dt>
                  <dd className="mt-1 text-slate-900">
                    {formData.targetAmount.toLocaleString()} {formData.currency}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Duration</dt>
                  <dd className="mt-1 text-slate-900">{formData.duration} days</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Milestones</dt>
                  <dd className="mt-1 text-slate-900">{formData.milestoneCount}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Payout balance</dt>
                  <dd className="mt-1 text-slate-900">
                    {milestoneTotal.toLocaleString()} {formData.currency}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Milestones</h3>
                <button
                  type="button"
                  onClick={() => goToStep('milestones')}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-4">
                {formData.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                          Milestone {index + 1}
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">{milestone.title}</h4>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {milestone.targetAmount.toLocaleString()} {formData.currency}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{milestone.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Due {milestone.dueDate || 'TBD'}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                        {milestone.verificationType.toLowerCase()} validator
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">Evidence:</span> {milestone.evidenceCriteria}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={formData.evidencePolicyAcknowledged}
                  onChange={event =>
                    setFormData(prev => ({
                      ...prev,
                      evidencePolicyAcknowledged: event.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  I acknowledge that validators may request additional documentation and that escrow releases occur only after validator approval.
                </span>
              </label>
              {errors.evidencePolicyAcknowledged && (
                <p className="mt-2 text-sm text-red-500">{errors.evidencePolicyAcknowledged}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadDraft}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-600"
              >
                Download JSON draft
              </button>
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-600"
              >
                Copy summary
              </button>
              <button
                type="button"
                onClick={runSimulation}
                className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Test milestone plan
              </button>
            </div>

            {simulationSummary && (
              <pre className="whitespace-pre-wrap rounded-3xl bg-slate-900 p-4 text-sm text-slate-100">
                {simulationSummary}
              </pre>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderGuidance = () => {
    const config = STEP_CONFIG[currentStep];
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-sky-500 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Step overview</p>
          <h2 className="mt-2 text-2xl font-bold">{config.title}</h2>
          <p className="mt-3 text-sm text-emerald-50/90">{config.description}</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm text-emerald-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Tips</p>
          <ul className="mt-3 space-y-2">
            {config.tips.map(tip => (
              <li key={tip} className="flex gap-2">
                <span className="mt-1 text-emerald-400">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Checklist</p>
          <ul className="mt-3 space-y-2">
            {config.checklist.map(item => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 text-emerald-400">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {currentStep === 'milestones' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Health</p>
            <p className="mt-3">
              {Math.abs(milestoneVariance) <= 0.5
                ? 'Milestone payouts currently match your funding target.'
                : `Adjust payouts by ${Math.abs(milestoneVariance).toFixed(2)} ${formData.currency} to balance.`}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Create project</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Guided wizard for developer submissions
            </h1>
          </div>
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Step {currentIndex + 1} of {steps.length}
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {renderStepContent()}
        </div>
        <aside className="space-y-6">{renderGuidance()}</aside>
      </div>

      <nav className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {steps.map(step => (
            <button
              key={step}
              type="button"
              onClick={() => goToStep(step)}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-semibold transition',
                step === currentStep
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
              )}
            >
              {STEP_CONFIG[step].title}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={currentIndex === 0}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          {currentStep !== 'review' ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {saving ? 'Submitting…' : 'Submit for review'}
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

function analyzeYield(duration: number) {
  if (duration <= 90) return 6.5;
  if (duration <= 180) return 7.2;
  if (duration <= 360) return 7.8;
  return 8.4;
}

export default ProjectCreationWizard;






