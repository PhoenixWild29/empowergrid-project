import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useWalletContext } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import GovernanceScreen from '../screens/GovernanceScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PortfolioScreen from '../screens/PortfolioScreen';

// Import navigators
import ProjectsStack from './ProjectsStack';

const Tab = createBottomTabNavigator();

const AppNavigator: React.FC = () => {
  const { connected } = useWalletContext();
  const { theme } = useTheme();

  const tabBarOptions = {
    activeTintColor: theme.colors.primary,
    inactiveTintColor: theme.colors.textSecondary,
    style: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
    },
  };

  const screenOptions = ({ route }: any) => ({
    tabBarIcon: ({ focused, color, size }: any) => {
      let iconName: any;

      if (route.name === 'Home') {
        iconName = focused ? 'home' : 'home-outline';
      } else if (route.name === 'Projects') {
        iconName = focused ? 'bulb' : 'bulb-outline';
      } else if (route.name === 'Governance') {
        iconName = focused ? 'people' : 'people-outline';
      } else if (route.name === 'Profile') {
        iconName = focused ? 'person' : 'person-outline';
      } else if (route.name === 'Portfolio') {
        iconName = focused ? 'pie-chart' : 'pie-chart-outline';
      }

      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.textSecondary,
    tabBarStyle: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
    },
    headerStyle: {
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
    },
    headerTintColor: theme.colors.text,
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  });

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'EmpowerGRID',
          }}
        />
        <Tab.Screen
          name="Projects"
          component={ProjectsStack}
          options={{
            title: 'Projects',
            headerShown: false, // Hide header since stack navigator handles it
          }}
        />
        <Tab.Screen
          name="Governance"
          component={GovernanceScreen}
          options={{
            title: 'Governance',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: connected ? 'Profile' : 'Connect',
          }}
        />
        <Tab.Screen
          name="Portfolio"
          component={PortfolioScreen}
          options={{
            title: 'Portfolio',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;