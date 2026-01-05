import { useCampaigns } from "@/contexts/CampaignContext";
import { router } from "expo-router";
import { Clock, CheckCircle2, AlertCircle, Copy, Target, Plus } from "lucide-react-native";
import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, isToday, parseISO } from "date-fns";

export default function HomeScreen() {
  const { campaigns, actions } = useCampaigns();

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
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/campaigns")}
          activeOpacity={0.7}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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
            {activeCampaigns.length === 0 && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push("/campaigns")}
                activeOpacity={0.7}
              >
                <Text style={styles.createButtonText}>Create Campaign</Text>
              </TouchableOpacity>
            )}
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
              <TouchableOpacity onPress={() => router.push("/campaigns")}>
                <Text style={styles.seeAll}>See All</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerSpacer: {
    flex: 1,
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
});
