import { useCampaigns } from "@/contexts/CampaignContext";
import { Campaign } from "@/types";
import { router, Href } from "expo-router";
import { Clock, CheckCircle2, AlertCircle, Copy, Target, Plus } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, isToday, parseISO } from "date-fns";

export default function HomeScreen() {
  const { campaigns, actions, addCampaign } = useCampaigns();
  const [showNewCampaignModal, setShowNewCampaignModal] = useState<boolean>(false);

  const todayActions = useMemo(() => {
    return actions.filter((action) => {
      if (!action.scheduledFor) return false;
      const scheduledDate = parseISO(action.scheduledFor);
      return isToday(scheduledDate) && action.status === "pending";
    });
  }, [actions]);

  const recentCompleted = useMemo(() => {
    return actions
      .filter((a) => a.status === "completed" && a.completedAt)
      .sort((a, b) => {
        const dateA = parseISO(a.completedAt!);
        const dateB = parseISO(b.completedAt!);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 3);
  }, [actions]);

  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowNewCampaignModal(true)}
        activeOpacity={0.7}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={todayActions.length === 0 ? styles.scrollViewContent : undefined}
        showsVerticalScrollIndicator={false}
      >
        {todayActions.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ready to Post</Text>
              <Text style={styles.actionCount}>{todayActions.length}</Text>
            </View>
            {todayActions.map((action) => {
              const campaign = campaigns.find((c) => c.id === action.campaignId);
              return (
                <ActionCard key={action.id} action={action} campaign={campaign} />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Clock size={48} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No actions scheduled</Text>
            <Text style={styles.emptyDescription}>
              {activeCampaigns.length === 0
                ? "Create a campaign to start generating posts"
                : "Check back later for scheduled posts"}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowNewCampaignModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.createButtonText}>Create Campaign</Text>
            </TouchableOpacity>
          </View>
        )}

        {recentCompleted.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentCompleted.map((action) => {
              const campaign = campaigns.find((c) => c.id === action.campaignId);
              return (
                <View key={action.id} style={styles.activityCard}>
                  <View style={styles.activityIcon}>
                    <CheckCircle2 size={16} color="#10B981" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityType}>
                      {action.type === "post" ? "Posted" : "Commented"} in r/{action.subreddit}
                    </Text>
                    <Text style={styles.activityCampaign}>{campaign?.name || "Unknown"}</Text>
                  </View>
                  <Text style={styles.activityTime}>
                    {action.completedAt
                      ? format(parseISO(action.completedAt), "h:mm a")
                      : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {activeCampaigns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Campaigns</Text>
              <TouchableOpacity onPress={() => setShowNewCampaignModal(true)}>
                <Text style={styles.seeAll}>Create New</Text>
              </TouchableOpacity>
            </View>
            {activeCampaigns.slice(0, 3).map((campaign) => (
              <TouchableOpacity
                key={campaign.id}
                style={styles.campaignCard}
                onPress={() => router.push(`/campaign/${campaign.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.campaignIcon}>
                  <Target size={20} color="#FF6B35" />
                </View>
                <View style={styles.campaignInfo}>
                  <Text style={styles.campaignName}>{campaign.name}</Text>
                  <Text style={styles.campaignProduct} numberOfLines={1}>
                    {campaign.product}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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

  const isFormValid = name.trim() !== "" &&
    product.trim() !== "" &&
    goal !== "" &&
    postsPerMonth !== "" &&
    accounts.length > 0;

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
          <View style={{ width: 60 }} />
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
          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[
              styles.modalSubmitButton,
              !isFormValid && styles.modalSubmitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid}
            activeOpacity={0.8}
          >
            <Text style={styles.modalSubmitButtonText}>Create Campaign</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ActionCard({
  action,
  campaign,
}: {
  action: any;
  campaign: any;
}) {
  const handleCopy = () => {
    // Copy action content to clipboard
    // This will be implemented when content generation is ready
  };

  const handleComplete = () => {
    // Mark action as completed
    // This will be implemented when action management is ready
  };

  return (
    <View style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <View style={styles.actionIconContainer}>
          {action.type === "post" ? (
            <AlertCircle size={20} color="#FF6B35" />
          ) : (
            <Clock size={20} color="#10B981" />
          )}
        </View>
        <View style={styles.actionInfo}>
          <Text style={styles.actionType}>
            {action.type === "post" ? "Post" : "Comment"} in r/{action.subreddit}
          </Text>
          <Text style={styles.actionCampaign}>{campaign?.name || "Unknown Campaign"}</Text>
        </View>
        {action.scheduledFor && (
          <Text style={styles.actionTime}>
            {format(parseISO(action.scheduledFor), "h:mm a")}
          </Text>
        )}
      </View>

      {action.content && (
        <View style={styles.actionContent}>
          <Text style={styles.actionContentText} numberOfLines={3}>
            {action.content}
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        {action.content && (
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <Copy size={16} color="#FF6B35" />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
          activeOpacity={0.7}
        >
          <CheckCircle2 size={16} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>I Posted</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  addButton: {
    position: "absolute",
    top: 16,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B35",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B35",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  createButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  actionCampaign: {
    fontSize: 12,
    color: "#64748B",
  },
  actionTime: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  actionContent: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  actionContentText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  copyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#FFF1ED",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF6B35",
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B35",
  },
  completeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  activityCampaign: {
    fontSize: 12,
    color: "#64748B",
  },
  activityTime: {
    fontSize: 12,
    color: "#64748B",
  },
  campaignCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  campaignIcon: {
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
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  campaignProduct: {
    fontSize: 12,
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
  modalFooter: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  modalSubmitButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalSubmitButtonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
});
