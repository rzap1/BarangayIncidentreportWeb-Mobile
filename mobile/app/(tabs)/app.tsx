// App.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './Login';
import Home from './Home';
import IncidentReport from './IncidentReport'; // Assuming this is your IncidentReport component

export type RootStackParamList = {
  Login: undefined;
  Home: { username: string };
  IncidentReport: undefined; // Add IncidentReport here
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="IncidentReport" component={IncidentReport} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
