import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, VerificationLevel } from '../../types/auth';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export default function UserProfile() {
  const { user, updateProfile, logout } = useAuth();
  const { handleError } = useErrorHandler();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    website: user?.website || '',
    twitter: user?.twitter || '',
    linkedin: user?.linkedin || '',
  });

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      handleError(error, 'Failed to update profile');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRole.CREATOR:
        return 'bg-blue-100 text-blue-800';
      case UserRole.FUNDER:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationBadgeColor = (level: VerificationLevel) => {
    switch (level) {
      case VerificationLevel.PREMIUM:
        return 'bg-purple-100 text-purple-800';
      case VerificationLevel.VERIFIED:
        return 'bg-green-100 text-green-800';
      case VerificationLevel.BASIC:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      <div className='flex justify-between items-start mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>User Profile</h2>
        <div className='flex space-x-2'>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className='px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800'
            >
              Edit Profile
            </button>
          )}
          <button
            onClick={logout}
            className='px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800'
          >
            Logout
          </button>
        </div>
      </div>

      <div className='space-y-6'>
        {/* Basic Info */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Wallet Address
            </label>
            <div className='flex items-center space-x-2'>
              <code className='bg-gray-100 px-3 py-2 rounded text-sm font-mono'>
                {user.walletAddress.toString().slice(0, 8)}...
                {user.walletAddress.toString().slice(-8)}
              </code>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(user.walletAddress.toString())
                }
                className='text-gray-400 hover:text-gray-600'
                title='Copy address'
              >
                📋
              </button>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Role
            </label>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
            >
              {user.role.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Statistics
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {user.stats.projectsCreated}
              </div>
              <div className='text-sm text-gray-600'>Projects Created</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {user.stats.projectsFunded}
              </div>
              <div className='text-sm text-gray-600'>Projects Funded</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {user.stats.totalFunded.toLocaleString()}
              </div>
              <div className='text-sm text-gray-600'>SOL Funded</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-orange-600'>
                {user.reputation}
              </div>
              <div className='text-sm text-gray-600'>Reputation</div>
            </div>
          </div>
        </div>

        {/* Editable Profile Form */}
        {isEditing ? (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Username
                </label>
                <input
                  type='text'
                  value={formData.username}
                  onChange={e => handleInputChange('username', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email
                </label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={e => handleInputChange('bio', e.target.value)}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Tell us about yourself...'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Website
                </label>
                <input
                  type='url'
                  value={formData.website}
                  onChange={e => handleInputChange('website', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='https://...'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Twitter
                </label>
                <input
                  type='text'
                  value={formData.twitter}
                  onChange={e => handleInputChange('twitter', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='@username'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  LinkedIn
                </label>
                <input
                  type='text'
                  value={formData.linkedin}
                  onChange={e => handleInputChange('linkedin', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='linkedin.com/in/username'
                />
              </div>
            </div>

            <div className='flex space-x-3'>
              <button
                type='submit'
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                Save Changes
              </button>
              <button
                type='button'
                onClick={() => setIsEditing(false)}
                className='px-4 py-2 text-gray-600 hover:text-gray-800'
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Display Profile */
          <div className='space-y-4'>
            {user.username && (
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Username
                </label>
                <p className='text-gray-900'>{user.username}</p>
              </div>
            )}

            {user.email && (
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Email
                </label>
                <p className='text-gray-900'>{user.email}</p>
              </div>
            )}

            {user.bio && (
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Bio
                </label>
                <p className='text-gray-900'>{user.bio}</p>
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {user.website && (
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Website
                  </label>
                  <a
                    href={user.website}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:text-blue-800'
                  >
                    {user.website}
                  </a>
                </div>
              )}

              {user.twitter && (
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Twitter
                  </label>
                  <a
                    href={`https://twitter.com/${user.twitter.replace('@', '')}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:text-blue-800'
                  >
                    {user.twitter}
                  </a>
                </div>
              )}

              {user.linkedin && (
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    LinkedIn
                  </label>
                  <a
                    href={`https://linkedin.com/in/${user.linkedin}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:text-blue-800'
                  >
                    {user.linkedin}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className='border-t pt-4'>
          <div className='flex justify-between items-center'>
            <div>
              <p className='text-sm text-gray-600'>Member since</p>
              <p className='text-sm font-medium text-gray-900'>
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-sm text-gray-600'>Verification</p>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationBadgeColor(VerificationLevel.NONE)}`}
              >
                {user.verified ? 'VERIFIED' : 'UNVERIFIED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
