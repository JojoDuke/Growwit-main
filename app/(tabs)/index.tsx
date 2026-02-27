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
  Menu,
  Bell,
  Search,
  Users as UsersIcon,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, isToday, parseISO } from "date-fns";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { campaigns, actions, completeAction } = useCampaigns();
  const [activeTab, setActiveTab] = useState("All");

  const tabs = ["All", "Upcoming", "Meetings", "Projects"];

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
      {/* Top Header Icons */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.iconCircle}>
          <Menu size={20} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.rightNav}>
          <TouchableOpacity style={styles.iconCircle}>
            <Bell size={20} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle}>
            <Search size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Headline */}
        <View style={styles.headerSection}>
          <Text style={styles.mainHeadline}>
            Jumpstart your morning &{"\n"}make it productive!
          </Text>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabPill,
                activeTab === tab && styles.activeTabPill
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {todayActions.length > 0 ? (
          <View style={styles.listSection}>
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

  // Progress logic
  const isPost = action.type === "post";
  const priorityColor = isPost ? "#EF4444" : "#F59E0B";
  const priorityLabel = isPost ? "Urgent" : "Medium";
  const deadlineDate = action.scheduledFor
    ? format(parseISO(action.scheduledFor), "MMMM d, yyyy")
    : "Flexible";

  return (
    <View style={styles.newActionCard}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => router.push(`/campaign/${campaign?.id}` as any)}
      >
        <Text style={styles.cardTitle}>{action.title || `Action in r/${action.subreddit}`}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {action.content || `Post to ${action.subreddit} as part of ${campaign?.name}`}
        </Text>
      </TouchableOpacity>

      <View style={styles.metaRow}>
        <View style={styles.badgeRow}>
          <View style={styles.priorityBadge}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={styles.priorityText}>{priorityLabel}</Text>
          </View>
          <View style={styles.deadlineBadge}>
            <Text style={styles.deadlineText}>Deadline : {deadlineDate}</Text>
          </View>
        </View>

        {/* Dummy Avatar Group */}
        <View style={styles.avatarGroup}>
          <View style={[styles.avatar, { backgroundColor: '#E2E8F0', zIndex: 3 }]} />
          <View style={[styles.avatar, { backgroundColor: '#CBD5E1', zIndex: 2, marginLeft: -8 }]} />
          <View style={[styles.avatar, { backgroundColor: '#94A3B8', zIndex: 1, marginLeft: -8 }]} />
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressPercent}>
            {isPost ? "60%" : "20%"}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: isPost ? '60%' : '20%' }]} />
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.iconButton} onPress={handleOpenReddit}>
          <ExternalLink size={18} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleCopy(action.content || "", "Content")}>
          <Copy size={18} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkButton} onPress={handleComplete}>
          <CheckCircle2 size={18} color="#FFFFFF" />
          <Text style={styles.checkButtonText}>Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFA", // Light grey from image
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  rightNav: {
    flexDirection: "row",
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  mainHeadline: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "800",
    color: "#1E293B",
  },
  tabScroll: {
    marginBottom: 20,
    maxHeight: 50,
  },
  tabContainer: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  activeTabPill: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  activeTabText: {
    color: "#1E293B",
  },
  scrollView: {
    flex: 1,
  },
  listSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  newActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  deadlineBadge: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  deadlineText: {
    fontSize: 12,
    color: "#64748B",
  },
  avatarGroup: {
    flexDirection: "row",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  progressSection: {
    backgroundColor: "#F9FAFA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    width: "100%",
  },
  progressBarFill: {
    height: 4,
    backgroundColor: "#22C55E",
    borderRadius: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  checkButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  createButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#1E293B",
    borderRadius: 12,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
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
});
