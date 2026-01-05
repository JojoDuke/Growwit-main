import { useCampaigns } from "@/contexts/CampaignContext";
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, Clock } from "lucide-react-native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { differenceInDays, parseISO } from "date-fns";

export default function SafetyScreen() {
  const { safetyRules, safetyMetrics, campaigns, actions } = useCampaigns();

  const safetyStatus = useMemo(() => {
    let warnings = 0;
    let healthy = 0;
    
    campaigns.forEach((campaign) => {
      campaign.accounts.forEach((account) => {
        const todayPostCount = safetyMetrics.todayPosts[account.id] || 0;
        if (todayPostCount >= safetyRules.maxPostsPerAccountPerDay) {
          warnings++;
        } else {
          healthy++;
        }

        const ratio = safetyMetrics.accountCommentToPostRatio[account.id];
        if (ratio && ratio.posts > 0) {
          const actualRatio = ratio.comments / ratio.posts;
          if (actualRatio < safetyRules.commentToPostRatio.min) {
            warnings++;
          } else {
            healthy++;
          }
        }
      });
    });

    return { warnings, healthy, total: warnings + healthy };
  }, [safetyMetrics, safetyRules, campaigns]);

  const recentActions = useMemo(() => {
    return actions
      .filter((a) => a.status === "completed")
      .sort((a, b) => {
        const dateA = a.completedAt ? parseISO(a.completedAt) : new Date(0);
        const dateB = b.completedAt ? parseISO(b.completedAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [actions]);

  const subredditCooldowns = useMemo(() => {
    const cooldowns: { subreddit: string; lastPosted: string; daysAgo: number }[] = [];
    
    Object.entries(safetyMetrics.subredditLastPosted).forEach(([subreddit, lastPosted]) => {
      const daysAgo = differenceInDays(new Date(), parseISO(lastPosted));
      cooldowns.push({ subreddit, lastPosted, daysAgo });
    });

    return cooldowns.sort((a, b) => a.daysAgo - b.daysAgo);
  }, [safetyMetrics]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Safety</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Shield size={32} color={safetyStatus.warnings === 0 ? "#10B981" : "#F59E0B"} />
            <Text style={styles.statusTitle}>
              {safetyStatus.warnings === 0 ? "All Systems Healthy" : "Some Warnings"}
            </Text>
          </View>
          <Text style={styles.statusDescription}>
            {safetyStatus.warnings === 0
              ? "You're following all safety guidelines. Keep up the good work!"
              : `${safetyStatus.warnings} account(s) need attention. Review the guidelines below.`}
          </Text>
          <View style={styles.statusMetrics}>
            <View style={styles.statusMetric}>
              <CheckCircle2 size={20} color="#10B981" />
              <Text style={styles.statusMetricText}>
                {safetyStatus.healthy} Healthy
              </Text>
            </View>
            {safetyStatus.warnings > 0 && (
              <View style={styles.statusMetric}>
                <AlertTriangle size={20} color="#F59E0B" />
                <Text style={styles.statusMetricText}>
                  {safetyStatus.warnings} Warnings
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Rules</Text>
          
          <View style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <Text style={styles.ruleIcon}>📝</Text>
              <Text style={styles.ruleTitle}>Posts Per Day</Text>
            </View>
            <Text style={styles.ruleDescription}>
              Maximum {safetyRules.maxPostsPerAccountPerDay} posts per account per day
            </Text>
          </View>

          <View style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <Text style={styles.ruleIcon}>💬</Text>
              <Text style={styles.ruleTitle}>Comments Per Hour</Text>
            </View>
            <Text style={styles.ruleDescription}>
              Maximum {safetyRules.maxCommentsPerHour} comments per hour
            </Text>
          </View>

          <View style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <Text style={styles.ruleIcon}>⏱️</Text>
              <Text style={styles.ruleTitle}>Time Between Actions</Text>
            </View>
            <Text style={styles.ruleDescription}>
              Minimum {safetyRules.minTimeBetweenActions} minutes between posts/comments
            </Text>
          </View>

          <View style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <Text style={styles.ruleIcon}>🔄</Text>
              <Text style={styles.ruleTitle}>Subreddit Cooldown</Text>
            </View>
            <Text style={styles.ruleDescription}>
              Wait {safetyRules.subredditCooldownDays} days before posting to same subreddit
            </Text>
          </View>

          <View style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <Text style={styles.ruleIcon}>📊</Text>
              <Text style={styles.ruleTitle}>Comment-to-Post Ratio</Text>
            </View>
            <Text style={styles.ruleDescription}>
              Maintain {safetyRules.commentToPostRatio.min}-{safetyRules.commentToPostRatio.max} comments for every post
            </Text>
          </View>
        </View>

        {subredditCooldowns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subreddit Cooldowns</Text>
            {subredditCooldowns.map((cooldown) => (
              <View key={cooldown.subreddit} style={styles.cooldownCard}>
                <View style={styles.cooldownInfo}>
                  <Text style={styles.cooldownSubreddit}>{cooldown.subreddit}</Text>
                  <Text style={styles.cooldownDays}>
                    {cooldown.daysAgo === 0 ? "Today" : `${cooldown.daysAgo}d ago`}
                  </Text>
                </View>
                <View style={styles.cooldownProgress}>
                  <View
                    style={[
                      styles.cooldownProgressBar,
                      {
                        width: `${Math.min(
                          (cooldown.daysAgo / safetyRules.subredditCooldownDays) * 100,
                          100
                        )}%`,
                        backgroundColor:
                          cooldown.daysAgo >= safetyRules.subredditCooldownDays
                            ? "#10B981"
                            : "#F59E0B",
                      },
                    ]}
                  />
                </View>
                {cooldown.daysAgo < safetyRules.subredditCooldownDays && (
                  <Text style={styles.cooldownWarning}>
                    {safetyRules.subredditCooldownDays - cooldown.daysAgo} days until safe
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {recentActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActions.map((action) => {
              const campaign = campaigns.find((c) => c.id === action.campaignId);
              return (
                <View key={action.id} style={styles.activityCard}>
                  <View style={styles.activityIcon}>
                    {action.type === "post" ? (
                      <TrendingUp size={16} color="#FF6B35" />
                    ) : (
                      <Clock size={16} color="#10B981" />
                    )}
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityType}>
                      {action.type === "post" ? "Posted" : "Commented"} in {action.subreddit}
                    </Text>
                    <Text style={styles.activityCampaign}>{campaign?.name || "Unknown"}</Text>
                  </View>
                  <Text style={styles.activityTime}>
                    {action.completedAt
                      ? differenceInDays(new Date(), parseISO(action.completedAt)) === 0
                        ? "Today"
                        : `${differenceInDays(new Date(), parseISO(action.completedAt))}d ago`
                      : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Safety Tips</Text>
          <Text style={styles.tipText}>
            • Vary your posting times to appear more natural
          </Text>
          <Text style={styles.tipText}>
            • Comment more than you post to build credibility
          </Text>
          <Text style={styles.tipText}>
            • Engage authentically with other posts in your target subreddits
          </Text>
          <Text style={styles.tipText}>
            • Never mention your product in every comment
          </Text>
          <Text style={styles.tipText}>
            • Read subreddit rules before posting
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
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
  scrollView: {
    flex: 1,
  },
  statusCard: {
    margin: 20,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  statusDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 16,
  },
  statusMetrics: {
    flexDirection: "row",
    gap: 16,
  },
  statusMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusMetricText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  ruleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  ruleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  ruleIcon: {
    fontSize: 24,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  ruleDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  cooldownCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cooldownInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cooldownSubreddit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  cooldownDays: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  cooldownProgress: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  cooldownProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  cooldownWarning: {
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "500",
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
    backgroundColor: "#F8FAFC",
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
  tipsSection: {
    margin: 20,
    padding: 20,
    backgroundColor: "#FFF9F5",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFEEE5",
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 4,
  },
});

