import { useCampaigns } from "@/contexts/CampaignContext";
import { Campaign } from "@/types";
import { router, Href } from "expo-router";
import { Plus, Target, Users, TrendingUp } from "lucide-react-native";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CampaignsScreen() {
  const { campaigns, addCampaign, isLoading } = useCampaigns();
  const [showNewCampaignModal, setShowNewCampaignModal] = useState<boolean>(false);

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const draftCampaigns = campaigns.filter((c) => c.status === "draft");

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Campaigns</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewCampaignModal(true)}
          activeOpacity={0.7}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {campaigns.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={64} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No campaigns yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first Reddit growth campaign to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowNewCampaignModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyButtonText}>Create Campaign</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeCampaigns.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active</Text>
                {activeCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </View>
            )}

            {draftCampaigns.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Drafts</Text>
                {draftCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <NewCampaignModal
        visible={showNewCampaignModal}
        onClose={() => setShowNewCampaignModal(false)}
        onSubmit={async (campaign: Campaign) => {
          await addCampaign(campaign);
          setShowNewCampaignModal(false);
          router.push(`/campaign/${campaign.id}` as Href);
        }}
      />
    </SafeAreaView>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <TouchableOpacity
      style={styles.campaignCard}
      onPress={() => router.push(`/campaign/${campaign.id}` as Href)}
      activeOpacity={0.7}
    >
      <View style={styles.campaignHeader}>
        <View style={styles.campaignIconContainer}>
          <Target size={20} color="#FF6B35" />
        </View>
        <View style={styles.campaignInfo}>
          <Text style={styles.campaignName}>{campaign.name}</Text>
          <Text style={styles.campaignProduct} numberOfLines={1}>
            {campaign.product}
          </Text>
        </View>
        {campaign.status === "active" && <View style={styles.activeBadge} />}
      </View>

      <View style={styles.campaignStats}>
        <View style={styles.stat}>
          <Users size={16} color="#64748B" />
          <Text style={styles.statText}>{campaign.accounts.length} accounts</Text>
        </View>
        <View style={styles.stat}>
          <TrendingUp size={16} color="#64748B" />
          <Text style={styles.statText}>{campaign.postsPerMonth} posts/month</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function NewCampaignModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (campaign: Campaign) => void;
}) {
  const [name, setName] = useState<string>("");
  const [product, setProduct] = useState<string>("");
  const [goal, setGoal] = useState<string>("users");
  const [targetAudience, setTargetAudience] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [postsPerMonth, setPostsPerMonth] = useState<string>("50");

  const handleSubmit = () => {
    if (!name || !product || accounts.length === 0) {
      return;
    }

    const campaign: Campaign = {
      id: `campaign-${Date.now()}`,
      name,
      product,
      goal: goal as Campaign["goal"],
      targetAudience: targetAudience || undefined,
      accounts: accounts.map((acc, idx) => ({
        id: `account-${idx}`,
        name: acc,
        karma: 0,
        accountAge: 0,
      })),
      postsPerMonth: parseInt(postsPerMonth) || 50,
      commentsPerDay: { min: 3, max: 7 },
      createdAt: new Date().toISOString(),
      status: "draft",
    };

    onSubmit(campaign);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setProduct("");
    setGoal("users");
    setTargetAudience("");
    setAccountName("");
    setAccounts([]);
    setPostsPerMonth("50");
  };

  const addAccount = () => {
    if (accountName.trim()) {
      setAccounts([...accounts, accountName.trim()]);
      setAccountName("");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer} edges={["top", "bottom"]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Campaign</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.modalDone}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Campaign Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Launch Product X"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Product/Service</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={product}
              onChangeText={setProduct}
              placeholder="What are you promoting?"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.goalButtons}>
              {["users", "clients", "feedback", "awareness"].map((g) => (
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Target Audience (Optional)</Text>
            <TextInput
              style={styles.input}
              value={targetAudience}
              onChangeText={setTargetAudience}
              placeholder="e.g., College students, Entrepreneurs"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Reddit Accounts</Text>
            <View style={styles.accountInputRow}>
              <TextInput
                style={[styles.input, styles.accountInput]}
                value={accountName}
                onChangeText={setAccountName}
                placeholder="u/accountname"
                placeholderTextColor="#94A3B8"
                onSubmitEditing={addAccount}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addAccountButton} onPress={addAccount}>
                <Plus size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            {accounts.length > 0 && (
              <View style={styles.accountsList}>
                {accounts.map((acc, idx) => (
                  <View key={idx} style={styles.accountChip}>
                    <Text style={styles.accountChipText}>{acc}</Text>
                    <TouchableOpacity onPress={() => setAccounts(accounts.filter((_, i) => i !== idx))}>
                      <Text style={styles.accountChipRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Posts Per Month</Text>
            <TextInput
              style={styles.input}
              value={postsPerMonth}
              onChangeText={setPostsPerMonth}
              placeholder="50"
              keyboardType="number-pad"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1E293B",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 24,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  campaignCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  campaignHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  campaignIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  campaignProduct: {
    fontSize: 14,
    color: "#64748B",
  },
  activeBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  campaignStats: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#64748B",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  modalCancel: {
    fontSize: 16,
    color: "#64748B",
  },
  modalDone: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
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
  },
  textArea: {
    minHeight: 80,
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
  },
  goalButtonTextActive: {
    color: "#FF6B35",
  },
  accountInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  accountInput: {
    flex: 1,
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
  },
  accountChipRemove: {
    fontSize: 20,
    color: "#64748B",
    lineHeight: 20,
  },
});

