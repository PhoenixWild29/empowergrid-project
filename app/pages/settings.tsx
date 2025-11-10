import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import AccountSettingsForm from '../components/auth/AccountSettingsForm';
import clsx from 'clsx';
import { User, Bell, Shield, Palette, Save, CheckCircle, XCircle } from 'lucide-react';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'preferences';

interface NotificationPreferences {
  milestoneUpdates: boolean;
  fundingAlerts: boolean;
  projectNews: boolean;
  governanceVotes: boolean;
  weeklyDigest: boolean;
  emailNotifications: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  requirePasswordForTransactions: boolean;
}

interface Preferences {
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'SOL' | 'USDC';
  language: string;
  timezone: string;
}

export default function SettingsPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    milestoneUpdates: true,
    fundingAlerts: true,
    projectNews: true,
    governanceVotes: false,
    weeklyDigest: true,
    emailNotifications: true,
  });
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    requirePasswordForTransactions: false,
  });
  const [preferences, setPreferences] = useState<Preferences>({
    theme: 'system',
    currency: 'USD',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      try {
        const response = await fetch(`/api/users/${user.id}/profile`);
        if (response.ok) {
          const data = await response.json();
          if (data.notifications) setNotifications(data.notifications);
          if (data.security) setSecurity(data.security);
          if (data.preferences) setPreferences(data.preferences);
        }
      } catch (error) {
        console.error('[Settings] Failed to load preferences', error);
      }
    };
    if (isAuthenticated) {
      loadSettings();
    }
  }, [user, isAuthenticated]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifications,
          security,
          preferences,
        }),
      });
      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('[Settings] Failed to save', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600' />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  return (
    <DashboardLayout>
      <div className='space-y-8'>
        <header>
          <h1 className='text-3xl font-bold text-slate-900 sm:text-4xl'>Settings & Security</h1>
          <p className='mt-2 text-sm text-slate-600'>Manage your account, privacy, and notification preferences.</p>
        </header>

        <div className='grid gap-6 lg:grid-cols-4'>
          <aside className='lg:col-span-1'>
            <nav className='space-y-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm'>
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type='button'
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition',
                      activeTab === tab.id
                        ? 'bg-emerald-100 text-emerald-700 shadow-inner'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <Icon className='h-4 w-4' />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className='lg:col-span-3'>
            <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8'>
              {activeTab === 'profile' && (
                <div className='space-y-6'>
                  <div>
                    <h2 className='text-xl font-semibold text-slate-900'>Profile Information</h2>
                    <p className='mt-1 text-sm text-slate-600'>Update your public profile and account details.</p>
                  </div>
                  <AccountSettingsForm />
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className='space-y-6'>
                  <div>
                    <h2 className='text-xl font-semibold text-slate-900'>Notification Preferences</h2>
                    <p className='mt-1 text-sm text-slate-600'>Choose how and when you receive updates.</p>
                  </div>
                  <div className='space-y-4'>
                    <ToggleSetting
                      label='Milestone Updates'
                      description='Get notified when project milestones are verified or delayed'
                      checked={notifications.milestoneUpdates}
                      onChange={checked => setNotifications({ ...notifications, milestoneUpdates: checked })}
                    />
                    <ToggleSetting
                      label='Funding Alerts'
                      description='Receive alerts when projects you follow reach funding milestones'
                      checked={notifications.fundingAlerts}
                      onChange={checked => setNotifications({ ...notifications, fundingAlerts: checked })}
                    />
                    <ToggleSetting
                      label='Project News'
                      description='Updates from project creators and community announcements'
                      checked={notifications.projectNews}
                      onChange={checked => setNotifications({ ...notifications, projectNews: checked })}
                    />
                    <ToggleSetting
                      label='Governance Votes'
                      description='Notifications for new proposals and voting deadlines'
                      checked={notifications.governanceVotes}
                      onChange={checked => setNotifications({ ...notifications, governanceVotes: checked })}
                    />
                    <ToggleSetting
                      label='Weekly Digest'
                      description='Summary of your portfolio performance and platform activity'
                      checked={notifications.weeklyDigest}
                      onChange={checked => setNotifications({ ...notifications, weeklyDigest: checked })}
                    />
                    <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                      <ToggleSetting
                        label='Email Notifications'
                        description='Enable email delivery for all notification types'
                        checked={notifications.emailNotifications}
                        onChange={checked => setNotifications({ ...notifications, emailNotifications: checked })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className='space-y-6'>
                  <div>
                    <h2 className='text-xl font-semibold text-slate-900'>Security Settings</h2>
                    <p className='mt-1 text-sm text-slate-600'>Manage your account security and authentication.</p>
                  </div>
                  <div className='space-y-6'>
                    <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-semibold text-slate-900'>Two-Factor Authentication</p>
                          <p className='mt-1 text-sm text-slate-600'>Add an extra layer of security to your account</p>
                        </div>
                        <button
                          type='button'
                          onClick={() => setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled })}
                          className={clsx(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            security.twoFactorEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                          )}
                        >
                          <span
                            className={clsx(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition',
                              security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>
                      {!security.twoFactorEnabled && (
                        <p className='mt-2 text-xs text-amber-600'>Two-factor authentication is recommended for accounts with active investments.</p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-slate-900'>Session Timeout</label>
                      <p className='mt-1 text-sm text-slate-600'>Automatically log out after inactivity (minutes)</p>
                      <select
                        value={security.sessionTimeout}
                        onChange={e => setSecurity({ ...security, sessionTimeout: Number(e.target.value) })}
                        className='mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={0}>Never (not recommended)</option>
                      </select>
                    </div>

                    <ToggleSetting
                      label='Require Password for Transactions'
                      description='Prompt for wallet confirmation on every investment or withdrawal'
                      checked={security.requirePasswordForTransactions}
                      onChange={checked => setSecurity({ ...security, requirePasswordForTransactions: checked })}
                    />

                    <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4'>
                      <p className='text-sm font-semibold text-amber-900'>Wallet Connection</p>
                      <p className='mt-1 text-xs text-amber-800'>
                        Your wallet is connected via Phantom. To disconnect, use the wallet extension or the disconnect button in the header.
                      </p>
                      {user?.walletAddress && (
                        <p className='mt-2 font-mono text-xs text-amber-900'>
                          {user.walletAddress.toString().slice(0, 8)}...{user.walletAddress.toString().slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className='space-y-6'>
                  <div>
                    <h2 className='text-xl font-semibold text-slate-900'>Display & Language</h2>
                    <p className='mt-1 text-sm text-slate-600'>Customize your EmpowerGrid experience.</p>
                  </div>
                  <div className='space-y-6'>
                    <div>
                      <label className='block text-sm font-semibold text-slate-900'>Theme</label>
                      <select
                        value={preferences.theme}
                        onChange={e => setPreferences({ ...preferences, theme: e.target.value as 'light' | 'dark' | 'system' })}
                        className='mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
                      >
                        <option value='system'>System Default</option>
                        <option value='light'>Light</option>
                        <option value='dark'>Dark</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-slate-900'>Currency Display</label>
                      <select
                        value={preferences.currency}
                        onChange={e => setPreferences({ ...preferences, currency: e.target.value as 'USD' | 'SOL' | 'USDC' })}
                        className='mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
                      >
                        <option value='USD'>USD ($)</option>
                        <option value='SOL'>SOL</option>
                        <option value='USDC'>USDC</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-slate-900'>Language</label>
                      <select
                        value={preferences.language}
                        onChange={e => setPreferences({ ...preferences, language: e.target.value })}
                        className='mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
                      >
                        <option value='en'>English</option>
                        <option value='es'>Español</option>
                        <option value='fr'>Français</option>
                        <option value='de'>Deutsch</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-slate-900'>Timezone</label>
                      <select
                        value={preferences.timezone}
                        onChange={e => setPreferences({ ...preferences, timezone: e.target.value })}
                        className='mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500'
                      >
                        <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                          {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </option>
                        <option value='America/New_York'>Eastern Time (ET)</option>
                        <option value='America/Chicago'>Central Time (CT)</option>
                        <option value='America/Denver'>Mountain Time (MT)</option>
                        <option value='America/Los_Angeles'>Pacific Time (PT)</option>
                        <option value='Europe/London'>London (GMT)</option>
                        <option value='Europe/Paris'>Paris (CET)</option>
                        <option value='Asia/Tokyo'>Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className='mt-8 flex items-center justify-between border-t border-slate-200 pt-6'>
                <div>
                  {saveStatus === 'success' && (
                    <p className='flex items-center gap-2 text-sm font-semibold text-emerald-600'>
                      <CheckCircle className='h-4 w-4' />
                      Settings saved successfully
                    </p>
                  )}
                  {saveStatus === 'error' && (
                    <p className='flex items-center gap-2 text-sm font-semibold text-red-600'>
                      <XCircle className='h-4 w-4' />
                      Failed to save settings
                    </p>
                  )}
                </div>
                <button
                  type='button'
                  onClick={handleSave}
                  disabled={saving}
                  className='inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-emerald-300'
                >
                  <Save className='h-4 w-4' />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className='flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4'>
      <div className='flex-1'>
        <p className='font-semibold text-slate-900'>{label}</p>
        <p className='mt-1 text-sm text-slate-600'>{description}</p>
      </div>
      <button
        type='button'
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative ml-4 inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-emerald-600' : 'bg-slate-300'
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white transition',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
