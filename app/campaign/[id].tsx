import { useLocalSearchParams, useRouter } from "expo-router";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Share
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    ChevronLeft,
    MoreVertical,
    Target,
    Clock,
    CheckCircle2,
    AlertCircle,
    Pause,
    Play,
    Trash2,
    TrendingUp,
    Users
} from "lucide-react-native";
import { useCampaigns } from "@/contexts/CampaignContext";
import { format, parseISO } from "date-fns";
import React, { useMemo } from "react";

export default function CampaignDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { campaigns, actions, updateCampaign, deleteCampaign } = useCampaigns();

    const campaign = useMemo(() =>
        campaigns.find(c => c.id === id),
        [campaigns, id]
    );

    const campaignActions = useMemo(() =>
        actions.filter(a => a.campaignId === id),
        [actions, id]
    );

    const completedCount = useMemo(() =>
        campaignActions.filter(a => a.status === "completed").length,
        [campaignActions]
    );

    const upcomingActions = useMemo(() =>
        campaignActions
            .filter(a => a.status === "pending")
            .sort((a, b) => {
                if (!a.scheduledFor || !b.scheduledFor) return 0;
                return parseISO(a.scheduledFor).getTime() - parseISO(b.scheduledFor).getTime();
            }),
        [campaignActions]
    );

    const pastActions = useMemo(() =>
        campaignActions
            .filter(a => a.status === "completed")
            .sort((a, b) => {
                if (!a.completedAt || !b.completedAt) return 0;
                return parseISO(b.completedAt).getTime() - parseISO(a.completedAt).getTime();
            }),
        [campaignActions]
    );

    if (!campaign) {
        return (
            <View style={styles.errorContainer}>
                <Text>Campaign not found</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleDelete = () => {
        Alert.alert(
            "Delete Campaign",
            "Are you sure you want to delete this campaign? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteCampaign(campaign.id);
                        router.back();
                    }
                }
            ]
        );
    };

    const toggleStatus = async () => {
        const newStatus = campaign.status === "active" ? "paused" : "active";
        await updateCampaign(campaign.id, { status: newStatus });
    };

    const progress = Math.min((completedCount / campaign.postsPerMonth) * 100, 100);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace("/");
                        }
                    }}
                    style={styles.headerButton}
                >
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{campaign.name}</Text>
                <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                    <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status & Quick Info */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryMain}>
                        <View style={styles.goalBadge}>
                            <Target size={14} color="#FF6B35" />
                            <Text style={styles.goalText}>{campaign.goal.replace('_', ' ')}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.statusToggle, campaign.status === 'paused' && styles.statusTogglePaused]}
                            onPress={toggleStatus}
                        >
                            {campaign.status === 'active' ? (
                                <><Pause size={14} color="#64748B" /><Text style={styles.statusToggleText}>Pause</Text></>
                            ) : (
                                <><Play size={14} color="#10B981" /><Text style={[styles.statusToggleText, { color: '#10B981' }]}>Resume</Text></>
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.campaignProduct}>{campaign.product}</Text>

                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Current Progress</Text>
                            <Text style={styles.progressValue}>{completedCount} / {campaign.postsPerMonth} posts</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Users size={16} color="#94A3B8" />
                            <Text style={styles.metaText}>{campaign.accounts.length} Accounts</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <TrendingUp size={16} color="#94A3B8" />
                            <Text style={styles.metaText}>{campaign.postsPerMonth} Mon. Target</Text>
                        </View>
                    </View>
                </View>

                {/* Strategy Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upcoming Strategy</Text>
                    {upcomingActions.length > 0 ? (
                        upcomingActions.map((action, idx) => (
                            <View key={action.id} style={styles.strategyItem}>
                                <View style={[styles.strategyDot, idx === 0 && styles.strategyDotActive]} />
                                <View style={styles.strategyContent}>
                                    <Text style={styles.strategyDate}>
                                        {action.scheduledFor ? format(parseISO(action.scheduledFor), "EEE, MMM d • h:mm a") : "Scheduled"}
                                    </Text>
                                    <Text style={styles.strategyTask}>Post to r/{action.subreddit}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No actions scheduled</Text>
                    )}
                </View>

                {/* History Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>History</Text>
                    {pastActions.length > 0 ? (
                        pastActions.map((action) => (
                            <View key={action.id} style={styles.historyItem}>
                                <View style={styles.historyIcon}>
                                    <CheckCircle2 size={16} color="#10B981" />
                                </View>
                                <View style={styles.historyContent}>
                                    <Text style={styles.historyTitle}>Success in r/{action.subreddit}</Text>
                                    <Text style={styles.historyDate}>
                                        {action.completedAt ? format(parseISO(action.completedAt), "MMM d, h:mm a") : "Completed"}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No history yet</Text>
                    )}
                </View>

                <View style={{ height: 40 }} />
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "700",
        color: "#1E293B",
        textAlign: "center",
        marginHorizontal: 8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    summaryCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    summaryMain: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    goalBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF1ED",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    goalText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#FF6B35",
        textTransform: "uppercase",
    },
    statusToggle: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#F1F5F9",
        gap: 6,
    },
    statusTogglePaused: {
        backgroundColor: "#ECFDF5",
    },
    statusToggleText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748B",
    },
    campaignProduct: {
        fontSize: 15,
        color: "#475569",
        lineHeight: 22,
        marginBottom: 20,
    },
    progressSection: {
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748B",
    },
    progressValue: {
        fontSize: 13,
        fontWeight: "700",
        color: "#1E293B",
    },
    progressBarBg: {
        height: 8,
        backgroundColor: "#F1F5F9",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#FF6B35",
        borderRadius: 4,
    },
    metaRow: {
        flexDirection: "row",
        gap: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    metaText: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1E293B",
        marginBottom: 16,
    },
    strategyItem: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 16,
    },
    strategyDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#CBD5E1",
        marginTop: 8,
    },
    strategyDotActive: {
        backgroundColor: "#FF6B35",
        transform: [{ scale: 1.5 }],
    },
    strategyContent: {
        flex: 1,
    },
    strategyDate: {
        fontSize: 12,
        fontWeight: "600",
        color: "#94A3B8",
        marginBottom: 2,
    },
    strategyTask: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
    },
    historyItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    historyIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#ECFDF5",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    historyContent: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
    },
    historyDate: {
        fontSize: 12,
        color: "#94A3B8",
        marginTop: 2,
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    backLink: {
        marginTop: 12,
        color: "#FF6B35",
        fontWeight: "600",
    },
    emptyText: {
        fontSize: 14,
        color: "#94A3B8",
        fontStyle: "italic",
        textAlign: "center",
        marginTop: 10,
    },
});
