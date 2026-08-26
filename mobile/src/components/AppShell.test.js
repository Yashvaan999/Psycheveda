import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AppShell from './AppShell';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockLogout = jest.fn(async () => {});
const mockGoalReminders = jest.fn();

jest.mock('expo-router', () => {
  const ReactLocal = require('react');
  const ReactNative = require('react-native');
  return {
    useRouter: () => ({ replace: mockReplace, push: mockPush }),
    usePathname: () => '/dashboard',
    Link: ({ href, children, asChild }) => {
      if (asChild && ReactLocal.isValidElement(children)) {
        return ReactLocal.cloneElement(children, {
          accessibilityHint: `link:${href}`,
          testID: `link-${href}`,
        });
      }
      return (
        <ReactNative.Pressable testID={`link-${href}`} accessibilityHint={`link:${href}`}>
          {children}
        </ReactNative.Pressable>
      );
    },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: {
      bless_points_balance: 12,
      veda_streak: 3,
      last_activity_date: '2026-08-25',
    },
    logout: mockLogout,
  }),
}));

jest.mock('../lib/api', () => ({
  api: {
    goalReminders: (...args) => mockGoalReminders(...args),
  },
}));

jest.mock('./Modal', () => {
  const { View, Text: RNText } = require('react-native');
  return function MockModal({ open, title, children }) {
    if (!open) return null;
    return (
      <View accessibilityRole="dialog">
        {title ? <RNText>{title}</RNText> : null}
        {children}
      </View>
    );
  };
});

jest.mock('./GlowSparkle', () => {
  const { Text: RNText } = require('react-native');
  return function MockGlowSparkle() {
    return <RNText>GlowSparkle</RNText>;
  };
});

jest.mock('./BlessIcon', () => {
  const { Text: RNText } = require('react-native');
  return function MockBlessIcon() {
    return <RNText>BlessIcon</RNText>;
  };
});

jest.mock('lucide-react-native', () => {
  const { Text: RNText } = require('react-native');
  const Icon = ({ testID }) => <RNText>{testID || 'Icon'}</RNText>;
  return {
    Home: Icon,
    BookOpen: Icon,
    Sparkles: Icon,
    LogOut: Icon,
    Heart: Icon,
    Flame: Icon,
    Bell: Icon,
    Target: Icon,
    X: Icon,
  };
});

async function renderAppShell(children = <Text>Child</Text>, { reminders = [] } = {}) {
  let resolveFetch;
  mockGoalReminders.mockImplementation(
    () => new Promise((resolve) => {
      resolveFetch = resolve;
    }),
  );

  const utils = render(<AppShell>{children}</AppShell>);

  await act(async () => {
    expect(resolveFetch).toBeDefined();
    resolveFetch(reminders);
  });

  return utils;
}

describe('AppShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children and bottom navigation labels', async () => {
    await renderAppShell(<Text>Shell child</Text>);

    expect(screen.getByText('Shell child')).toBeTruthy();
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Journal')).toBeTruthy();
    expect(screen.getByText('Gratitude')).toBeTruthy();
    expect(screen.getByText('Revive')).toBeTruthy();
    expect(screen.getByLabelText('Psycheveda — empower your mind')).toBeTruthy();
  });

  it('shows bless and streak badges from the authenticated user', async () => {
    await renderAppShell();

    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('opens the Bless Points modal', async () => {
    await renderAppShell();

    fireEvent.press(screen.getByLabelText('Bless Points'));
    expect(screen.getByText('Bless Points')).toBeTruthy();
    expect(screen.getByText('accumulated grace')).toBeTruthy();
    expect(screen.getByText(/Offer today/)).toBeTruthy();
  });

  it('opens the Veda Streak modal with last activity', async () => {
    await renderAppShell();

    fireEvent.press(screen.getByLabelText('Veda Streak'));
    expect(screen.getByText('Veda Streak')).toBeTruthy();
    expect(screen.getByText('unbroken devotion')).toBeTruthy();
    expect(screen.getByText('2026-08-25')).toBeTruthy();
  });

  it('loads reminders and shows empty state in the Reminders modal', async () => {
    await renderAppShell();

    expect(mockGoalReminders).toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Reminders'));
    expect(screen.getByText(/You.?re all caught up/)).toBeTruthy();
  });

  it('shows reminder goals and navigates when a reminder is pressed', async () => {
    await renderAppShell(<Text>Child</Text>, {
      reminders: [{ id: 'goal-1', title: 'Morning walk', pillar_label: 'Body' }],
    });

    expect(screen.getByText('1')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Reminders'));
    expect(screen.getByText('Morning walk')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();

    fireEvent.press(screen.getByText('Log'));
    expect(mockPush).toHaveBeenCalledWith('/goals/goal-1');
  });

  it('logs out and routes to auth', async () => {
    await renderAppShell();

    fireEvent.press(screen.getByLabelText('Log out'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/auth');
    });
  });
});
