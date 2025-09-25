import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProfile from '../../../components/auth/UserProfile';
import { AuthProvider, fetchUserProfile, mockUpdateProfile, useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/auth';

// Mock PublicKey
jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn().mockImplementation((value) => ({
    toString: () => value || 'mock-public-key',
    equals: jest.fn(),
  })),
}));

// Mock AuthContext functions
jest.mock('../../../contexts/AuthContext', () => {
  const actual = jest.requireActual('../../../contexts/AuthContext');
  return {
    ...actual,
    fetchUserProfile: jest.fn(),
    mockUpdateProfile: jest.fn(),
    useAuth: jest.fn(),
  };
});

describe('UserProfile', () => {
  const mockUser = {
    id: 'test-user',
    walletAddress: { toString: () => 'test-wallet-address' },
    username: 'TestUser',
    email: 'test@example.com',
    bio: 'Test bio',
    website: 'https://example.com',
    twitter: 'testuser',
    linkedin: 'testuser-linkedin',
    role: UserRole.CREATOR,
    reputation: 85,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    verified: true,
    stats: {
      projectsCreated: 3,
      projectsFunded: 5,
      totalFunded: 1000,
      successfulProjects: 2,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render user profile information', async () => {
    // Mock authenticated state
    (useAuth as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      updateProfile: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true,
      isLoading: false,
      walletAddress: mockUser.walletAddress,
      error: null,
      login: jest.fn(),
      refreshProfile: jest.fn(),
      hasPermission: jest.fn(),
      switchRole: jest.fn(),
    });

    // Mock fetchUserProfile to resolve with mockUser
    (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <UserProfile />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('User Profile')).toBeInTheDocument();
    });

    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test bio')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('testuser-linkedin')).toBeInTheDocument();
  });

  test('should display user statistics', async () => {
    (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <UserProfile />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // projects created
      expect(screen.getByText('5')).toBeInTheDocument(); // projects funded
      expect(screen.getByText('1,000')).toBeInTheDocument(); // total funded
      expect(screen.getByText('85')).toBeInTheDocument(); // reputation
    });
  });

  test('should show wallet address with copy functionality', async () => {
    (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    render(
      <AuthProvider>
        <UserProfile />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('test-wal...-address')).toBeInTheDocument();
    });

    const copyButton = screen.getByTitle('Copy address');
    await userEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-wallet-address');
  });

  test('should display role badge correctly', async () => {
    (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <UserProfile />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('CREATOR')).toBeInTheDocument();
    });
  });

  test('should enter edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();

    (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <UserProfile />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Profile');
    await user.click(editButton);

    expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
  });

  test('should save profile changes', async () => {
    const user = userEvent.setup();

    (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

    const updatedUser = {
      ...mockUser,
      username: 'UpdatedUser',
    };

    (mockUpdateProfile as unknown as jest.Mock).mockResolvedValue(updatedUser);

    (useAuth as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      updateProfile: mockUpdateProfile,
      logout: jest.fn(),
      isAuthenticated: true,
      isLoading: false,
      walletAddress: mockUser.walletAddress,
      error: null,
      login: jest.fn(),
      refreshProfile: jest.fn(),
      hasPermission: jest.fn(),
      switchRole: jest.fn(),
    });

    render(
      <AuthProvider>
        <UserProfile />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByText('Edit Profile');
    await user.click(editButton);

    // Change username
    const usernameInput = screen.getByDisplayValue('TestUser');
    await user.clear(usernameInput);
    await user.type(usernameInput, 'UpdatedUser');

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    expect(mockUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'UpdatedUser' })
    );
  });

  test('should cancel edit mode', async () => {
    const user = userEvent.setup();

    (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <UserProfile />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByText('Edit Profile');
    await user.click(editButton);

    // Cancel changes
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Should be back to view mode
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('TestUser')).not.toBeInTheDocument();
  });

  test('should handle logout', async () => {
    const user = userEvent.setup();

    const mockLogout = jest.fn();

    (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

    (useAuth as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      updateProfile: jest.fn(),
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
      walletAddress: mockUser.walletAddress,
      error: null,
      login: jest.fn(),
      refreshProfile: jest.fn(),
      hasPermission: jest.fn(),
      switchRole: jest.fn(),
    });

    render(
      <AuthProvider>
        <UserProfile />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  test('should not render when user is not authenticated', () => {
    (useAuth as unknown as jest.Mock).mockReturnValue({
      user: null,
      updateProfile: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false,
      isLoading: false,
      walletAddress: null,
      error: null,
      login: jest.fn(),
      refreshProfile: jest.fn(),
      hasPermission: jest.fn(),
      switchRole: jest.fn(),
    });

    const { container } = render(
      <AuthProvider>
        <UserProfile />
      </AuthProvider>
    );

    expect(container.firstChild).toBeNull();
  });
});