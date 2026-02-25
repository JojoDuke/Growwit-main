import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    ChevronLeft,
    Copy,
    ExternalLink,
    Clock,
    ShieldCheck,
    MessageSquare,
    Calendar,
    Hash,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

export default function DraftDetailScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();

    const {
        id,
        title,
        body,
        subreddit,
        displayDate,
        displayTime,
        dateKey,
    } = params as Record<string, string>;

    const handleCopy = async (text: string, label: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert("Copied!", `${label} copied to clipboard.`);
    };

    const handleOpenReddit = () => {
        const url = `https://www.reddit.com/r/${subreddit}/submit`;
        Linking.openURL(url).catch(() =>
            Alert.alert("Error", "Could not open Reddit.")
        );
    };

    const safetyTips = [
        `Don't post more than once per day in r/${subreddit}`,
        "Engage in comments before or after posting",
        "Avoid including links in the first post",
        "Check community rules before submitting",
    ];

    const engagementTips = [
        "Reply to all comments within the first hour",
        "Ask a follow-up question to keep discussion alive",
        "Upvote relevant replies to signal engagement",
        "DM users who show genuine interest",
    ];

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Draft</Text>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleOpenReddit}
                >
                    <ExternalLink size={20} color="#FF6B35" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Subreddit + Schedule Row */}
                <View style={styles.metaRow}>
                    <View style={styles.subredditPill}>
                        <Hash size={12} color="#FF6B35" />
                        <Text style={styles.subredditText}>r/{subreddit}</Text>
                    </View>
                    <View style={styles.schedulePill}>
                        <Clock size={12} color="#64748B" />
                        <Text style={styles.scheduleText}>{displayDate} · {displayTime}</Text>
                    </View>
                </View>

                {/* Title Block */}
                <View style={styles.card}>
                    <View style={styles.cardLabelRow}>
                        <Text style={styles.cardLabel}>TITLE</Text>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={() => handleCopy(title, "Title")}
                        >
                            <Copy size={13} color="#FF6B35" />
                            <Text style={styles.copyText}>Copy</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.titleText}>{title}</Text>
                </View>

                {/* Body Block */}
                <View style={styles.card}>
                    <View style={styles.cardLabelRow}>
                        <Text style={styles.cardLabel}>BODY</Text>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={() => handleCopy(body, "Body")}
                        >
                            <Copy size={13} color="#FF6B35" />
                            <Text style={styles.copyText}>Copy</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.bodyText}>{body}</Text>
                </View>

                {/* Scheduling Detail */}
                <View style={styles.card}>
                    <View style={styles.cardLabelRow}>
                        <Text style={styles.cardLabel}>SCHEDULE</Text>
                    </View>
                    <View style={styles.scheduleDetailRow}>
                        <Calendar size={16} color="#94A3B8" />
                        <Text style={styles.scheduleDetailText}>
                            {displayDate} at {displayTime}
                        </Text>
                    </View>
                    <Text style={styles.scheduleNote}>
                        This post is scheduled to go live at the optimal peak window for r/{subreddit} based on community activity analysis.
                    </Text>
                </View>

                {/* Engagement Tips */}
                <View style={styles.card}>
                    <View style={styles.cardLabelRow}>
                        <MessageSquare size={13} color="#6366F1" />
                        <Text style={[styles.cardLabel, { color: "#6366F1" }]}>ENGAGEMENT STRATEGY</Text>
                    </View>
                    {engagementTips.map((tip, i) => (
                        <View key={i} style={styles.tipRow}>
                            <View style={[styles.tipDot, { backgroundColor: "#6366F1" }]} />
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    ))}
                </View>

                {/* Safety Info */}
                <View style={styles.card}>
                    <View style={styles.cardLabelRow}>
                        <ShieldCheck size={13} color="#10B981" />
                        <Text style={[styles.cardLabel, { color: "#10B981" }]}>SUBREDDIT SAFETY</Text>
                    </View>
                    <View style={styles.safetyBadgeRow}>
                        <View style={styles.safetyGreenBadge}>
                            <ShieldCheck size={14} color="#10B981" />
                            <Text style={styles.safetyGreenText}>Safe to Post</Text>
                        </View>
                    </View>
                    {safetyTips.map((tip, i) => (
                        <View key={i} style={styles.tipRow}>
                            <View style={[styles.tipDot, { backgroundColor: "#10B981" }]} />
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Footer CTA */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.openButton} onPress={handleOpenReddit}>
                    <ExternalLink size={18} color="#FFFFFF" />
                    <Text style={styles.openButtonText}>Open r/{subreddit} to Post</Text>
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
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1E293B",
        fontFamily: "Geist-Bold",
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    subredditPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "#FFF1ED",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#FF6B3525",
    },
    subredditText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FF6B35",
        fontFamily: "Geist-Bold",
    },
    schedulePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "#F1F5F9",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    scheduleText: {
        fontSize: 12,
        color: "#64748B",
        fontFamily: "Geist-Medium",
        fontWeight: "600",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    cardLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        gap: 6,
    },
    cardLabel: {
        fontSize: 10,
        fontWeight: "900",
        color: "#94A3B8",
        letterSpacing: 1.5,
        fontFamily: "Geist-Bold",
    },
    copyButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#FFF1ED",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    copyText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#FF6B35",
        fontFamily: "Geist-Bold",
    },
    titleText: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0F172A",
        lineHeight: 28,
        fontFamily: "Geist-Bold",
    },
    bodyText: {
        fontSize: 15,
        color: "#334155",
        lineHeight: 24,
        fontFamily: "Geist",
    },
    scheduleDetailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
    },
    scheduleDetailText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1E293B",
        fontFamily: "Geist-Bold",
    },
    scheduleNote: {
        fontSize: 13,
        color: "#64748B",
        lineHeight: 20,
        fontFamily: "Geist",
    },
    tipRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 10,
    },
    tipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: "#334155",
        lineHeight: 20,
        fontFamily: "Geist",
    },
    safetyBadgeRow: {
        marginBottom: 14,
    },
    safetyGreenBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#ECFDF5",
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    safetyGreenText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#10B981",
        fontFamily: "Geist-Bold",
    },
    footer: {
        padding: 20,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
    },
    openButton: {
        backgroundColor: "#FF6B35",
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    openButtonText: {
        fontSize: 16,
        fontWeight: "800",
        color: "#FFFFFF",
        fontFamily: "Geist-Bold",
    },
});
