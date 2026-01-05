import { Stack } from 'expo-router';
import { CampaignProvider } from '@/contexts/CampaignContext';

export default function RootLayout() {
  return (
    <CampaignProvider>
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
            animation: 'slide_from_bottom',
            headerShown: true,
            title: 'Create Campaign',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#000',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            gestureEnabled: true,
          }} 
        />
      </Stack>
    </CampaignProvider>
  );
}