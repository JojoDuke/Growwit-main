import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function CampaignCreateScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create New Campaign</Text>
        <Text style={styles.description}>
          Let's set up your Reddit growth campaign
        </Text>
        {/* We'll add the form here next */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
});

