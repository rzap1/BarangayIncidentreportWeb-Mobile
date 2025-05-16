// App.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './Login';
import Register from './Register';
import Home from './Home';
import IncidentReport from './IncidentReport';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: { username: string };
  IncidentReport: undefined;
};


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="IncidentReport" component={IncidentReport} />
        <Stack.Screen name="Register" component={Register} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

