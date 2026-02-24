import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    LayoutAnimation,
} from "react-native";
import {
    ChevronDown,
    Copy,
    Clock,
} from "lucide-react-native";

export const CollapsibleThought = ({ title, content }: { title: string; content: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={agentStyles.thoughtContainer}>
            <TouchableOpacity
                style={agentStyles.thoughtHeader}
                onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsOpen(!isOpen);
                }}
                activeOpacity={0.7}
            >
                <View style={agentStyles.thoughtLeft}>
                    <Text style={agentStyles.thoughtTitle}>{title}</Text>
                </View>
                <ChevronDown size={18} color="#94A3B8" style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }} />
            </TouchableOpacity>
            {isOpen && (
                <View style={agentStyles.thoughtBody}>
                    <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} style={{ maxHeight: 350 }}>
                        <FormattedOutput text={content} isInsideCollapse />
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

export const DraftCard = ({ title, content, subreddit, scheduledFor }: { title: string; content: string; subreddit?: string; scheduledFor?: string }) => {
    return (
        <View style={agentStyles.draftCard}>
            <View style={agentStyles.draftCardSubredditRow}>
                <View style={agentStyles.subredditBadge}>
                    <Text style={agentStyles.subredditBadgeText}>r/{subreddit || "community"}</Text>
                </View>
                <View style={agentStyles.draftCardActions}>
                    <TouchableOpacity style={agentStyles.draftActionButton}>
                        <Copy size={14} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={agentStyles.draftScheduleInfo}>
                <Text style={agentStyles.draftScheduleLabel}>Scheduled For:</Text>
                <Text style={agentStyles.draftScheduleValue}>{scheduledFor || "Analyzing peak window..."}</Text>
            </View>

            <View style={agentStyles.draftDivider} />

            <View style={agentStyles.draftField}>
                <Text style={agentStyles.draftLabel}>TITLE</Text>
                <Text style={agentStyles.draftValue}>{title}</Text>
            </View>

            <View style={agentStyles.draftField}>
                <Text style={agentStyles.draftLabel}>BODY</Text>
                <Text style={agentStyles.draftValue} numberOfLines={5}>
                    {content}
                </Text>
            </View>
        </View>
    );
};

export const FormattedOutput = ({ text }: { text: string }) => {
    // 1. Pre-process text to remove common AI "tells" and cleanup
    const cleanText = text
        .replace(/--- 🤖 HANDING OFF TO .*? ---/g, "")
        .replace(/\[STEP:\d+\]/g, "")
        .replace(/---/g, "")
        .trim();

    // 2. Extract sections based on the Headers
    const sections = {
        targeting: cleanText.match(/# 🎯 TARGET SUBREDDITS([\s\S]*?)(?=#|$)/i)?.[1].trim() || "",
        framing: cleanText.match(/# 💡 FRAMING STRATEGIES([\s\S]*?)(?=#|$)/i)?.[1].trim() || "",
        timing: cleanText.match(/📅 SCHEDULING (GMT 0):([\s\S]*?)(?=#|$|##)/i)?.[1].trim() || "",
        engagement: cleanText.match(/⚡ ENGAGEMENT STRATEGY:([\s\S]*?)(?=#|$|##)/i)?.[1].trim() || "",
    };

    const renderList = (content: string) => {
        const items = content.split(/\n+/).filter(line => line.trim().startsWith("-") || line.trim().startsWith("*"));
        if (items.length === 0) return <Text style={agentStyles.paragraphLine}>{content}</Text>;

        return items.map((item, idx) => (
            <View key={idx} style={agentStyles.bulletRow}>
                <View style={agentStyles.dot} />
                <Text style={agentStyles.bulletText}>{item.replace(/^[-*]\s*/, "").trim()}</Text>
            </View>
        ));
    };

    const renderKeyVal = (content: string) => {
        const lines = content.split("\n").filter(l => l.includes(":"));
        return lines.map((line, idx) => {
            const [label, ...val] = line.split(":");
            return (
                <View key={idx} style={agentStyles.labelItem}>
                    <Text style={agentStyles.boldLabel}>{label.replace(/\*/g, "").trim()}:</Text>
                    <Text style={agentStyles.labelText}>{val.join(":").trim().replace(/\*/g, "")}</Text>
                </View>
            );
        });
    };

    return (
        <View style={agentStyles.formattedContainer}>
            {/* Category: Communities */}
            {sections.targeting ? (
                <View style={agentStyles.strategyBlock}>
                    <View style={agentStyles.sectionHeaderRow}>
                        <Text style={agentStyles.categoryEmoji}>🎯</Text>
                        <Text style={agentStyles.sectionHeaderText}>TARGET COMMUNITIES</Text>
                    </View>
                    <View style={agentStyles.strategyContent}>
                        {renderList(sections.targeting)}
                    </View>
                </View>
            ) : null}

            {/* Category: Strategy */}
            {sections.framing ? (
                <View style={agentStyles.strategyBlock}>
                    <View style={agentStyles.sectionHeaderRow}>
                        <Text style={agentStyles.categoryEmoji}>💡</Text>
                        <Text style={agentStyles.sectionHeaderText}>FRAMING STRATEGIES</Text>
                    </View>
                    <View style={agentStyles.strategyContent}>
                        {renderKeyVal(sections.framing)}
                    </View>
                </View>
            ) : null}

            {/* Category: Intelligence */}
            {sections.timing || sections.engagement ? (
                <View style={agentStyles.strategyBlock}>
                    <View style={agentStyles.sectionHeaderRow}>
                        <Text style={agentStyles.categoryEmoji}>📅</Text>
                        <Text style={agentStyles.sectionHeaderText}>CAMPAIGN INTELLIGENCE</Text>
                    </View>
                    <View style={agentStyles.strategyContent}>
                        {sections.timing ? renderKeyVal(sections.timing) : null}
                        {sections.engagement ? (
                            <View style={{ marginTop: 12 }}>
                                <Text style={agentStyles.boldLabel}>Engagement Policy:</Text>
                                <Text style={agentStyles.paragraphLine}>{sections.engagement}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            ) : null}
        </View>
    );
};

export const agentStyles = StyleSheet.create({
    formattedContainer: {
        paddingVertical: 10,
    },
    strategyBlock: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    strategyContent: {
        marginTop: 16,
    },
    categoryEmoji: {
        fontSize: 20,
        marginRight: 4,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
        paddingBottom: 12,
    },
    sectionHeaderText: {
        fontSize: 12,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 1.5,
        fontFamily: "Geist-Bold",
    },
    contentBlock: {
        marginBottom: 20,
    },
    h1: {
        fontSize: 24,
        fontWeight: "900",
        color: "#1E293B",
        marginTop: 24,
        marginBottom: 12,
        fontFamily: "Geist-Bold",
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1E293B",
        marginTop: 20,
        marginBottom: 8,
        fontFamily: "Geist-Bold",
    },
    h3: {
        fontSize: 17,
        fontWeight: "700",
        color: "#334155",
        marginTop: 16,
        marginBottom: 6,
        fontFamily: "Geist-Bold",
    },
    paragraphLine: {
        fontSize: 15,
        color: "#475569",
        lineHeight: 24,
        marginBottom: 8,
        fontFamily: "Geist",
    },
    labelItem: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 10,
        backgroundColor: "#F8FAFC",
        padding: 10,
        borderRadius: 8,
        gap: 4,
    },
    boldLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: "#1E293B",
        fontFamily: "Geist-Bold",
        textTransform: "uppercase",
        opacity: 0.7,
    },
    labelText: {
        fontSize: 14,
        color: "#334155",
        fontFamily: "Geist",
        lineHeight: 20,
        flex: 1,
    },
    bulletRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
        paddingLeft: 4,
    },
    bullet: {
        fontSize: 15,
        color: "#FF6B35",
    },
    bulletText: {
        flex: 1,
        fontSize: 15,
        color: "#334155",
        fontFamily: "Geist",
    },
    thoughtContainer: {
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    thoughtHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    thoughtLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    thoughtTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748B",
    },
    thoughtBody: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        paddingTop: 10,
        height: "auto",
    },
    thoughtText: {
        fontSize: 13,
        color: "#64748B",
        fontStyle: "italic",
        lineHeight: 18,
    },
    draftCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    draftCardSubredditRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    subredditBadge: {
        backgroundColor: "#FFF1ED",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#FF6B3520",
    },
    subredditBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#FF6B35",
        fontFamily: "Geist-Bold",
    },
    draftCardActions: {
        flexDirection: "row",
        gap: 8,
    },
    draftActionButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        alignItems: "center",
        justifyContent: "center",
    },
    draftField: {
        marginBottom: 12,
    },
    draftLabel: {
        fontSize: 10,
        fontWeight: "800",
        color: "#94A3B8",
        letterSpacing: 1,
        marginBottom: 4,
        fontFamily: "Geist-Bold",
    },
    draftValue: {
        fontSize: 15,
        color: "#1E293B",
        lineHeight: 22,
        fontFamily: "Geist",
    },
    draftDivider: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginVertical: 12,
    },
    draftScheduleInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingTop: 4,
    },
    draftScheduleLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748B",
        fontFamily: "Geist-Bold",
    },
    draftScheduleValue: {
        fontSize: 12,
        color: "#475569",
        fontFamily: "Geist",
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#FF6B35",
    },
    resultContainer: {
        marginTop: 16,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
});
