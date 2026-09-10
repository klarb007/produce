import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#F4FBF5' },
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#F4FBF5' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'My Meals' }} />
        <Stack.Screen name="add-meal" options={{ title: 'Add a Meal', presentation: 'modal' }} />
        <Stack.Screen name="result" options={{ title: 'Meal Details' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
