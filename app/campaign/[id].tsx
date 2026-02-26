import { useLocalSearchParams, useRouter } from "expo-router";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    ChevronLeft,
    Target,
    Trash2,
    Users,
    TrendingUp,
} from "lucide-react-native";
import { useCampaigns } from "@/contexts/CampaignContext";
import React, { useMemo } from "react";
import { FormattedOutput } from "@/components/AgentUI";

export default function CampaignDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { campaigns, actions, deleteCampaign } = useCampaigns();

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

    if (!campaign) {
        return (
            <View style={styles.errorContainer}>
                <Text>Campaign not found</Text>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/campaigns")}>
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
                        router.canGoBack() ? router.back() : router.replace("/(tabs)/campaigns");
                    }
                }
            ]
        );
    };

    const progress = Math.min((completedCount / campaign.postsPerMonth) * 100, 100);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.canGoBack() ? router.back() : router.replace("/(tabs)/campaigns");
                        } else {
                            router.replace("/");
                        }
                    }}
                    style={styles.headerButton}
                >
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{campaign.name}</Text>
                <TouchableOpacity
                    onPress={handleDelete}
                    style={styles.headerButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
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
                        <View style={[styles.statusBadge, campaign.status === 'active' ? styles.statusBadgeActive : styles.statusBadgePaused]}>
                            <Text style={styles.statusBadgeText}>{campaign.status}</Text>
                        </View>
                    </View>

                    <Text style={styles.campaignProduct}>{campaign.product}</Text>

                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Campaign Progress</Text>
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

                {/* AI Generated Output Section */}
                <View style={styles.generationSection}>
                    <View style={styles.generationHeader}>
                        <Text style={styles.generationTitle}>AI STRATEGY & DRAFTS</Text>
                        <View style={styles.generationLine} />
                    </View>

                    {campaign.aiOutput ? (
                        <FormattedOutput text={campaign.aiOutput} />
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Text style={styles.placeholderText}>No detailed strategy found for this campaign.</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 60 }} />
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
        fontSize: 17,
        fontWeight: "700",
        color: "#1E293B",
        textAlign: "center",
        marginHorizontal: 4,
        fontFamily: "Geist-Bold",
    },
    content: {
        flex: 1,
        padding: 20,
    },
    summaryCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    summaryMain: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    goalBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF1ED",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 6,
    },
    goalText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#FF6B35",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeActive: {
        backgroundColor: "#F0FDF4",
    },
    statusBadgePaused: {
        backgroundColor: "#FEF2F2",
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#10B981",
        textTransform: "uppercase",
    },
    campaignProduct: {
        fontSize: 16,
        color: "#475569",
        lineHeight: 24,
        marginBottom: 24,
        fontFamily: "Geist",
    },
    progressSection: {
        marginBottom: 24,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
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
        height: 10,
        backgroundColor: "#F1F5F9",
        borderRadius: 5,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#FF6B35",
        borderRadius: 5,
    },
    metaRow: {
        flexDirection: "row",
        gap: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    metaText: {
        fontSize: 14,
        color: "#64748B",
        fontWeight: "600",
    },
    generationSection: {
        marginBottom: 24,
    },
    generationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    generationTitle: {
        fontSize: 11,
        fontWeight: "800",
        color: "#94A3B8",
        letterSpacing: 1.5,
    },
    generationLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E2E8F0",
    },
    placeholderContainer: {
        padding: 40,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F1F5F9',
        borderStyle: 'dashed',
        borderRadius: 20,
    },
    placeholderText: {
        color: '#94A3B8',
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
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
});
