import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';

import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import SignupScreen from './screens/auth/SignupScreen';

// App Screens
import DashboardScreen from './screens/app/DashboardScreen';
import BudgetsScreen from './screens/app/BudgetsScreen';
import TransactionsScreen from './screens/app/TransactionsScreen';
import AnalyticsScreen from './screens/app/AnalyticsScreen';
import SettingsScreen from './screens/app/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitle: getTabTitle(route.name),
        tabBarLabel: getTabLabel(route.name),
        tabBarIcon: ({ color, size }) => getTabIcon(route.name, color, size),
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainApp" component={AppTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function getTabTitle(routeName: string): string {
  const titles: Record<string, string> = {
    Dashboard: '💰 Dashboard',
    Budgets: '📊 Budgets',
    Transactions: '💳 Transactions',
    Analytics: '📈 Analytics',
    Settings: '⚙️ Settings',
  };
  return titles[routeName] || 'Budgeting Tool';
}

function getTabLabel(routeName: string): string {
  const labels: Record<string, string> = {
    Dashboard: 'Dashboard',
    Budgets: 'Budgets',
    Transactions: 'Transactions',
    Analytics: 'Analytics',
    Settings: 'Settings',
  };
  return labels[routeName] || '';
}

function getTabIcon(routeName: string, color: string, size: number): React.ReactNode {
  const icons: Record<string, string> = {
    Dashboard: '💰',
    Budgets: '📊',
    Transactions: '💳',
    Analytics: '📈',
    Settings: '⚙️',
  };
  return <Text style={{ fontSize: size, color }}>{icons[routeName]}</Text>;
}
