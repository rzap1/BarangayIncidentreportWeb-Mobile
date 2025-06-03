// App.tsx - Updated with TimeIn and Notifications routes

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './Login';
import Register from './Register';
import Home from './Home';
import IncidentReport from './IncidentReport';
import Profile from './Profile';
import TimeIn from './TimeIn';
import Notifications from './Notifications';

// Define the IncidentReport interface to match what's used in NavBar
interface IncidentReport {
  id: number;
  type: string;
  reported_by: string;
  location: string;
  status: string;
  assigned: string;
  created_at: string;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: { username: string };
  IncidentReport: { 
    username: string;
    incidentId?: number; 
    isViewMode?: boolean; 
  };
  Profile: { username: string };
  TimeIn: { username: string };
  Notifications: { 
    username: string;
    incidentNotifications?: IncidentReport[];
    onIncidentPress?: (incident: IncidentReport) => void;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="IncidentReport" component={IncidentReport} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="TimeIn" component={TimeIn} />
        <Stack.Screen name="Notifications" component={Notifications} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}