import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { F } from '@/ui/kit';

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: F.blau },
          headerTintColor: '#fff',
          headerBackTitle: 'Zurück',
          contentStyle: { backgroundColor: F.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Kassenzonen-Planer' }} />
        <Stack.Screen name="projekt/[id]" options={{ title: 'Projekt' }} />
        <Stack.Screen name="einstellungen" options={{ title: 'Einstellungen' }} />
      </Stack>
    </>
  );
}
