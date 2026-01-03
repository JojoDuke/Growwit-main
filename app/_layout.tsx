import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Growwit' }} 
      />
      <Stack.Screen 
        name="campaign/create" 
        options={{ title: 'Create Campaign' }} 
      />
    </Stack>
  );
}

