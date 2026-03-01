import { useCampaigns } from "@/contexts/CampaignContext";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  UIManager,
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Target,
  Plus,
  ExternalLink,
  ShieldCheck,
  Bot,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, isToday, parseISO } from "date-fns";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { campaigns, actions, completeAction } = useCampaigns();

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
        onPress={() => router.push('/campaign/create')}
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
            <View style={[styles.sectionHeader, styles.topSectionHeader]}>
              <Text style={styles.sectionTitle}>Ready to Post</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.actionCount}>{todayActions.length}</Text>
              <View style={{ width: 64 }} />
            </View>
            {todayActions.map((action) => {
              const campaign = campaigns.find((c) => c.id === action.campaignId);
              return (
                <ActionCard
                  key={action.id}
                  action={action}
                  campaign={campaign}
                  onComplete={completeAction}
                />
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
              onPress={() => router.push('/campaign/create')}
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
              <TouchableOpacity onPress={() => router.push('/campaign/create')}>
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
    </SafeAreaView>
  );
}

function ActionCard({
  action,
  campaign,
  onComplete,
}: {
  action: any;
  campaign: any;
  onComplete: (id: string) => void;
}) {
  const handleCopy = async (text: string, type: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", `${type} copied to clipboard!`);
  };

  const handleOpenReddit = () => {
    const url = `https://www.reddit.com/r/${action.subreddit}/submit`;
    Linking.openURL(url).catch((err) =>
      Alert.alert("Error", "Could not open Reddit submission page")
    );
  };

  const handleComplete = () => {
    onComplete(action.id);
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
          <View style={styles.statusRow}>
            <Text style={styles.actionCampaign}>{campaign?.name || "Unknown Campaign"}</Text>
            <View style={styles.safetyBadge}>
              <ShieldCheck size={12} color="#10B981" />
              <Text style={styles.safetyText}>Safe to post</Text>
            </View>
          </View>
        </View>
        {action.scheduledFor && (
          <Text style={styles.actionTime}>
            {format(parseISO(action.scheduledFor), "h:mm a")}
          </Text>
        )}
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.contentSections}>
        {action.title && (
          <View style={styles.contentSection}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>REDDIT TITLE</Text>
              <TouchableOpacity onPress={() => handleCopy(action.title, "Title")}>
                <Copy size={14} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            <View style={styles.snippetContainer}>
              <Text style={styles.snippetText}>{action.title}</Text>
            </View>
          </View>
        )}

        {action.content && (
          <View style={styles.contentSection}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>POST BODY</Text>
              <TouchableOpacity onPress={() => handleCopy(action.content, "Body")}>
                <Copy size={14} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            <View style={styles.snippetContainer}>
              <Text style={styles.snippetText}>{action.content}</Text>
              {action.cta && (
                <Text style={styles.ctaText}>{action.cta}</Text>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.openRedditButton}
          onPress={handleOpenReddit}
          activeOpacity={0.7}
        >
          <ExternalLink size={16} color="#FF6B35" />
          <Text style={styles.openRedditText}>Open r/{action.subreddit}</Text>
        </TouchableOpacity>

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
    marginBottom: 20,
  },
  topSectionHeader: {
    height: 44,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF1ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionType: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 8,
  },
  actionCampaign: {
    fontSize: 13,
    color: "#64748B",
  },
  safetyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  safetyText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#10B981",
    textTransform: "uppercase",
  },
  actionTime: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  contentSections: {
    gap: 16,
    marginBottom: 16,
  },
  contentSection: {
    gap: 8,
  },
  sectionLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  snippetContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  snippetText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },
  ctaText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  openRedditButton: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  openRedditText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  completeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#10B981",
    gap: 8,
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
});
