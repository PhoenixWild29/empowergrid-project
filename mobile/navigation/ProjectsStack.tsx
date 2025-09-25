import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import ProjectsScreen from '../screens/ProjectsScreen';
import ProjectDetailsScreen from '../screens/ProjectDetailsScreen';

const Stack = createStackNavigator();

const ProjectsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#00AEEF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ProjectsList"
        component={ProjectsScreen}
        options={{
          title: 'Projects',
          headerRight: () => (
            <Ionicons
              name="filter-outline"
              size={24}
              color="#fff"
              style={{ marginRight: 15 }}
              onPress={() => {/* Open filter modal */}}
            />
          ),
        }}
      />
      <Stack.Screen
        name="ProjectDetails"
        component={ProjectDetailsScreen}
        options={{
          title: 'Project Details',
          headerRight: () => (
            <Ionicons
              name="share-outline"
              size={24}
              color="#fff"
              style={{ marginRight: 15 }}
              onPress={() => {/* Share project */}}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
};

export default ProjectsStack;