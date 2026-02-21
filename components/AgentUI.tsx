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

export const FormattedOutput = ({
    text,
    title = "Phase 1: Strategist Agent",
    skipInitialThought = false,
    isInsideCollapse = false,
}: {
    text: string;
    title?: string;
    skipInitialThought?: boolean;
    isInsideCollapse?: boolean;
}) => {
    const parts = text.split(/(--- 🤖 HANDING OFF TO .*? ---)/g);

    const renderBlock = (content: string, index: number) => {
        const normalized = content
            .replace(/\r/g, "")
            .replace(/([^\n])\n([^\n])/g, "$1 $2")
            .replace(/([^\n])\n([^\n])/g, "$1 $2")
            .replace(/\s+\n/g, "\n")
            .replace(/\n\s+/g, "\n")
            .trim();

        const blocks = normalized.split(/\n\n+/);

        return (
            <View key={index} style={agentStyles.contentBlock}>
                {blocks.map((block, bIdx) => {
                    const trimmed = block.trim();
                    if (!trimmed) return null;

                    if (/\[STEP:\d+\]/.test(trimmed)) return null;

                    if (trimmed.startsWith("# ") || trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
                        const hText = trimmed
                            .replace(/^#+\s*/, "")
                            .replace(/\*/g, "")
                            .trim();

                        return (
                            <Text key={`h-${bIdx}`} style={trimmed.startsWith("# ") ? agentStyles.h1 : trimmed.startsWith("## ") ? agentStyles.h2 : agentStyles.h3}>
                                {hText}
                            </Text>
                        );
                    }

                    const labelPattern = /^\**([a-zA-Z\s]{2,20}):\**\s*(.*)/is;
                    const match = trimmed.match(labelPattern);

                    if (match) {
                        const label = match[1].trim();

                        const value = match[2]
                            .trim()
                            .replace(/\*\*/g, "")
                            .replace(/\n+/g, " ");

                        return (
                            <View key={`l-${bIdx}`} style={agentStyles.labelItem}>
                                <Text style={agentStyles.boldLabel}>{label}:</Text>
                                {value ? <Text style={agentStyles.labelText}>{value}</Text> : null}
                            </View>
                        );
                    }

                    if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ")) {
                        const bText = trimmed
                            .replace(/^[-•*]\s*/, "")
                            .replace(/\n+/g, " ")
                            .trim();
                        return (
                            <View key={`b-${bIdx}`} style={agentStyles.bulletRow}>
                                <Text style={agentStyles.bullet}>•</Text>
                                <Text style={agentStyles.bulletText}>{bText}</Text>
                            </View>
                        );
                    }

                    const cleanedBlock = trimmed.replace(/\n+/g, " ");
                    return (
                        <Text key={`p-${bIdx}`} style={isInsideCollapse ? agentStyles.thoughtText : agentStyles.paragraphLine}>
                            {cleanedBlock}
                        </Text>
                    );
                })}
            </View>
        );
    };

    if (isInsideCollapse) {
        return <View>{renderBlock(text, 0)}</View>;
    }

    return (
        <View style={agentStyles.formattedContainer}>
            {parts.map((part, index) => {
                const trimmedPart = part.trim();
                if (!trimmedPart) return null;

                const isHandoff = trimmedPart.includes("--- 🤖 HANDING OFF TO");
                if (isHandoff) return null;

                // Split by draft markers but keep everything
                const segments = trimmedPart.split(/(?=(?:## |### |📍 )r\/)/g);

                return (
                    <View key={index}>
                        {segments.map((segment, sIdx) => {
                            const trimmedSegment = segment.trim();
                            if (!trimmedSegment) return null;

                            const isDraft = /^(?:## |### |📍 )r\//i.test(trimmedSegment);

                            if (isDraft) {
                                const subMatch = trimmedSegment.match(/^(?:## |### |📍 )\s*r\/([^\s\n:*]+)/i);
                                const sub = subMatch ? subMatch[1] : "community";

                                const titleMatch = trimmedSegment.match(/\*\*Title:\*\* (.*)/i);
                                const bodyMatch = trimmedSegment.match(/\*\*Body:\*\* ([\s\S]*?)(?=\n\n|\n\*\*|\n---|$)/i);
                                const scheduleMatch = trimmedSegment.match(/(?:Scheduled For|Time|📅 SCHEDULING).*?:\*\*? (.*)/is);

                                if (bodyMatch || titleMatch) {
                                    return (
                                        <DraftCard
                                            key={sIdx}
                                            subreddit={sub}
                                            title={titleMatch ? titleMatch[1].trim() : "Draft Title"}
                                            content={bodyMatch ? bodyMatch[1].trim() : "Draft Body"}
                                            scheduledFor={scheduleMatch ? scheduleMatch[1].trim() : undefined}
                                        />
                                    );
                                }
                            }

                            return renderBlock(trimmedSegment, sIdx);
                        })}
                    </View>
                );
            })}
        </View>
    );
};

export const agentStyles = StyleSheet.create({
    formattedContainer: {
        paddingVertical: 10,
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
        marginBottom: 8,
        gap: 4,
    },
    boldLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1E293B",
        fontFamily: "Geist-Bold",
    },
    labelText: {
        fontSize: 14,
        color: "#475569",
        fontFamily: "Geist",
    },
    bulletRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 6,
        paddingLeft: 4,
    },
    bullet: {
        fontSize: 15,
        color: "#FF6B35",
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        color: "#475569",
        lineHeight: 20,
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
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        paddingBottom: 4,
    },
    sectionHeaderText: {
        fontSize: 10,
        fontWeight: "800",
        color: "#64748B",
        letterSpacing: 2,
        textTransform: "uppercase",
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
