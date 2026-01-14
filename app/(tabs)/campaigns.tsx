import { useCampaigns } from "@/contexts/CampaignContext";
import { Campaign } from "@/types";
import { router, Href } from "expo-router";
import { Target, Users, TrendingUp } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CampaignsScreen() {
  const { campaigns, isLoading } = useCampaigns();

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {campaigns.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={64} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No campaigns yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first Reddit growth campaign to get started
            </Text>
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
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
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
});


