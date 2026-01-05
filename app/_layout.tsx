import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="campaign/create" 
        options={{ 
          presentation: 'modal',
          title: 'Create Campaign' 
        }} 
      />
    </Stack>
  );
}