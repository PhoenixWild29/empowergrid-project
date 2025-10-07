import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

interface Milestone {
  index: number;
  amountLamports: string;
  kwhTarget: string;
  co2Target: string;
  payee: string;
}

export default function CreateProject() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    governanceAuthority: '',
    oracleAuthority: '',
  });
  const [milestones, setMilestones] = useState<Milestone[]>([
    { index: 0, amountLamports: '', kwhTarget: '', co2Target: '', payee: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMilestoneChange = (
    index: number,
    field: keyof Milestone,
    value: string
  ) => {
    setMilestones(prev =>
      prev.map((milestone, i) =>
        i === index ? { ...milestone, [field]: value } : milestone
      )
    );
  };

  const addMilestone = () => {
    setMilestones(prev => [
      ...prev,
      {
        index: prev.length,
        amountLamports: '',
        kwhTarget: '',
        co2Target: '',
        payee: '',
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name || !formData.description) {
        throw new Error('Project name and description are required');
      }

      if (milestones.length === 0) {
        throw new Error('At least one milestone is required');
      }

      // Validate milestones
      for (const milestone of milestones) {
        if (
          !milestone.amountLamports ||
          !milestone.kwhTarget ||
          !milestone.co2Target ||
          !milestone.payee
        ) {
          throw new Error('All milestone fields are required');
        }
      }

      // In a real implementation, this would:
      // 1. Connect to wallet
      // 2. Create project transaction
      // 3. Create milestone transactions
      // 4. Submit to blockchain

      console.log('Creating project:', formData);
      console.log('Milestones:', milestones);

      // For now, just redirect to home
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Create New Project
          </h1>
          <p className='mt-2 text-gray-600'>
            Set up a renewable energy project with milestone-based funding
            goals.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Project Details */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>
              Project Details
            </h2>
            <div className='grid grid-cols-1 gap-6'>
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700'
                >
                  Project Name *
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500'
                  placeholder='Solar Farm Alpha'
                  required
                />
              </div>
              <div>
                <label
                  htmlFor='description'
                  className='block text-sm font-medium text-gray-700'
                >
                  Description *
                </label>
                <textarea
                  id='description'
                  name='description'
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500'
                  placeholder='A 100kW solar installation providing clean energy to 50 households...'
                  required
                />
              </div>
              <div>
                <label
                  htmlFor='governanceAuthority'
                  className='block text-sm font-medium text-gray-700'
                >
                  Governance Authority (Realms DAO)
                </label>
                <input
                  type='text'
                  id='governanceAuthority'
                  name='governanceAuthority'
                  value={formData.governanceAuthority}
                  onChange={handleInputChange}
                  className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500'
                  placeholder='DAO public key (leave empty for default)'
                />
              </div>
              <div>
                <label
                  htmlFor='oracleAuthority'
                  className='block text-sm font-medium text-gray-700'
                >
                  Oracle Authority (Switchboard)
                </label>
                <input
                  type='text'
                  id='oracleAuthority'
                  name='oracleAuthority'
                  value={formData.oracleAuthority}
                  onChange={handleInputChange}
                  className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500'
                  placeholder='Oracle public key (leave empty for default)'
                />
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Milestones
              </h2>
              <button
                type='button'
                onClick={addMilestone}
                className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium'
              >
                Add Milestone
              </button>
            </div>

            <div className='space-y-6'>
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className='border border-gray-200 rounded-lg p-4'
                >
                  <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-lg font-medium text-gray-900'>
                      Milestone {index + 1}
                    </h3>
                    {milestones.length > 1 && (
                      <button
                        type='button'
                        onClick={() => removeMilestone(index)}
                        className='text-red-600 hover:text-red-800 text-sm'
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Payout Amount (SOL) *
                      </label>
                      <input
                        type='number'
                        step='0.01'
                        value={milestone.amountLamports}
                        onChange={e =>
                          handleMilestoneChange(
                            index,
                            'amountLamports',
                            e.target.value
                          )
                        }
                        className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500'
                        placeholder='10.0'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Energy Target (kWh) *
                      </label>
                      <input
                        type='number'
                        value={milestone.kwhTarget}
                        onChange={e =>
                          handleMilestoneChange(
                            index,
                            'kwhTarget',
                            e.target.value
                          )
                        }
                        className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500'
                        placeholder='1000'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        CO₂ Target (kg) *
                      </label>
                      <input
                        type='number'
                        value={milestone.co2Target}
                        onChange={e =>
                          handleMilestoneChange(
                            index,
                            'co2Target',
                            e.target.value
                          )
                        }
                        className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500'
                        placeholder='400'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Payee Address *
                      </label>
                      <input
                        type='text'
                        value={milestone.payee}
                        onChange={e =>
                          handleMilestoneChange(index, 'payee', e.target.value)
                        }
                        className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500'
                        placeholder='Solana public key'
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className='bg-red-50 border border-red-200 rounded-md p-4'>
              <p className='text-red-800'>{error}</p>
            </div>
          )}

          <div className='flex justify-end space-x-4'>
            <button
              type='button'
              onClick={() => router.back()}
              className='bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium'
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
