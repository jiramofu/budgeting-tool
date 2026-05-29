import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Colors } from './constants/colors';

import LoginScreen from './screens/auth/LoginScreen';
import SignupScreen from './screens/auth/SignupScreen';

import DashboardScreen from './screens/app/DashboardScreen';
import BudgetsScreen from './screens/app/BudgetsScreen';
import TransactionsScreen from './screens/app/TransactionsScreen';
import AnalyticsScreen from './screens/app/AnalyticsScreen';
import SettingsScreen from './screens/app/SettingsScreen';
import AddTransactionScreen from './screens/app/AddTransactionScreen';
import AddBudgetScreen from './screens/app/AddBudgetScreen';

import { AuthStackParamList, AppTabParamList, AppStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

const NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.accent,
    background: Colors.bg,
    card: Colors.bgSurface,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.expense,
  },
};

const TAB_ICONS: Record<string, string> = {
  Dashboard: '🏠',
  Budgets: '📊',
  Transactions: '💳',
  Analytics: '📈',
  Settings: '⚙️',
};

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: Colors.bgSurface },
        headerTitleStyle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
        headerShadowVisible: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => (
          <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
            <Text style={{ fontSize: size - 2 }}>{TAB_ICONS[route.name]}</Text>
          </View>
        ),
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

function AppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bgSurface },
        headerTitleStyle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
        headerTintColor: Colors.accent,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <AppStack.Screen name="MainTabs" component={AppTabs} options={{ headerShown: false }} />
      <AppStack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ title: 'New Transaction', presentation: 'modal' }} />
      <AppStack.Screen name="AddBudget" component={AddBudgetScreen} options={{ title: 'Set Budget', presentation: 'modal' }} />
    </AppStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={NavTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  tabBar: {
    backgroundColor: Colors.bgSurface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingBottom: 6,
    paddingTop: 6,
    height: 62,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  tabIconWrap: {
    width: 36,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: Colors.accentSubtle,
  },
});
