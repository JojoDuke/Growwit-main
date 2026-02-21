import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react-native";

export default function CampaignCreateScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [product, setProduct] = useState("");
  const [goal, setGoal] = useState("discussion");
  const [accountAge, setAccountAge] = useState("30");
  const [accountKarma, setAccountKarma] = useState("500");
  const [postsPerMonth, setPostsPerMonth] = useState("30");
  const [accountName, setAccountName] = useState("");
  const [accounts, setAccounts] = useState<string[]>([]);

  const addAccount = () => {
    if (accountName && !accounts.includes(accountName)) {
      setAccounts([...accounts, accountName]);
      setAccountName("");
    }
  };

  const removeAccount = (name: string) => {
    setAccounts(accounts.filter((a) => a !== name));
  };

  const triggerAutofill = () => {
    setName("Smart Planner Launch");
    setProduct("An AI-powered meal planner for software engineers that integrates with GitHub and calendar to optimize deep work.");
    setGoal("discussion");
    setAccountAge("90");
    setAccountKarma("1500");
    setPostsPerMonth("45");
    setAccounts(["u/dev_helper", "u/logic_flow"]);
  };

  const handleGenerate = () => {
    router.push({
      pathname: "/campaign/generate",
      params: {
        name,
        product,
        goal,
        accountAge,
        accountKarma,
        postsPerMonth,
        accounts: JSON.stringify(accounts),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Campaign</Text>
        <TouchableOpacity onPress={triggerAutofill}>
          <Text style={styles.autofillText}>Autofill</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Campaign Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Q1 Growth Burst"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Product / Service Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={product}
              onChangeText={setProduct}
              multiline
              numberOfLines={4}
              placeholder="What are you promoting? The more detail, the better the AI strategy."
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.goalButtons}>
              {["discussion", "dms", "profile"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.goalButton, goal === g && styles.goalButtonActive]}
                  onPress={() => setGoal(g)}
                >
                  <Text style={[styles.goalButtonText, goal === g && styles.goalButtonTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>Age (Days)</Text>
              <TextInput
                style={styles.input}
                value={accountAge}
                onChangeText={setAccountAge}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.label}>Karma</Text>
              <TextInput
                style={styles.input}
                value={accountKarma}
                onChangeText={setAccountKarma}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Monthly Post Goal (Max 100)</Text>
            <TextInput
              style={styles.input}
              value={postsPerMonth}
              onChangeText={(val) => {
                const num = parseInt(val) || 0;
                if (num <= 100) setPostsPerMonth(val);
                else setPostsPerMonth("100");
              }}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Accounts</Text>
            <View style={styles.accountInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={accountName}
                onChangeText={setAccountName}
                placeholder="u/name"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.addAccountButton} onPress={addAccount}>
                <Plus size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>

            <View style={styles.accountsList}>
              {accounts.map((acc) => (
                <View key={acc} style={styles.accountChip}>
                  <Text style={styles.accountChipText}>{acc}</Text>
                  <TouchableOpacity onPress={() => removeAccount(acc)}>
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.mainButton, !name || !product || accounts.length === 0 ? styles.buttonDisabled : null]}
          onPress={handleGenerate}
          disabled={!name || !product || accounts.length === 0}
        >
          <Text style={styles.mainButtonText}>Generate Campaign</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    fontFamily: "Geist-Bold",
  },
  autofillText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
    fontFamily: "Geist-SemiBold",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  instructionCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    fontFamily: "Geist",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
    fontFamily: "Geist-SemiBold",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1E293B",
    fontFamily: "Geist",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  goalButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  goalButtonActive: {
    backgroundColor: "#FFF1ED",
    borderColor: "#FF6B35",
  },
  goalButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    textTransform: "capitalize",
    fontFamily: "Geist-Medium",
  },
  goalButtonTextActive: {
    color: "#FF6B35",
    fontFamily: "Geist-Bold",
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  flex1: {
    flex: 1,
  },
  accountInputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  addAccountButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF1ED",
    alignItems: "center",
    justifyContent: "center",
  },
  accountsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  accountChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  accountChipText: {
    fontSize: 14,
    color: "#1E293B",
    fontFamily: "Geist-Medium",
  },
  removeText: {
    fontSize: 18,
    color: "#94A3B8",
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  mainButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#F1F5F9",
    shadowOpacity: 0,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Geist-Bold",
  },
});
