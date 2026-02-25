import React, { useState, useRef, useMemo, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    FlatList,
    Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Share2, MoreHorizontal } from "lucide-react-native";
import { DraftCard } from "@/components/AgentUI";
import { useCampaigns } from "@/contexts/CampaignContext";
import { Campaign, Action, Account } from "@/types";

const { width } = Dimensions.get("window");

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

const CalendarDay = ({ date, month, year, postCounts, isCurrentMonth, todayKey }: {
    date: number;
    month: number;
    year: number;
    postCounts: Record<string, number>;
    isCurrentMonth: boolean;
    todayKey: string;
}) => {
    if (!isCurrentMonth) return <View style={styles.daySquareEmpty} />;

    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const count = postCounts[dateKey] || 0;
    const isToday = todayKey === dateKey;

    return (
        <View style={[
            styles.daySquare,
            count === 1 && styles.daySquarePost,
            count > 1 && styles.daySquareMultiple,
            isToday && styles.dayToday,
        ]}>
            <Text style={[
                styles.dayText,
                count > 0 && styles.dayTextWhite,
                isToday && count === 0 && styles.dayTextToday,
            ]}>{date}</Text>
            {count > 1 && <View style={styles.multiIndicator} />}
        </View>
    );
};

export default function ReviewScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { addCampaign } = useCampaigns();
    const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
    const [isCrafting, setIsCrafting] = useState(true);
    const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
    const [postCounts, setPostCounts] = useState<Record<string, number>>({});

    const year = new Date().getFullYear();
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    useEffect(() => {
        startCrafting();
    }, []);

    const startCrafting = async () => {
        try {
            setIsCrafting(true);

            const response = await fetch('http://192.168.1.204:3001/api/craft-real-posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aiOutput: params.aiOutput,
                    postsPerMonth: params.postsPerMonth,
                    productName: params.name as string,
                    productDescription: params.product as string,
                }),
            });

            if (!response.body) return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let postIndex = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                if (buffer.includes("[POST_END]")) {
                    const parts = buffer.split("[POST_END]");
                    buffer = parts.pop() || "";

                    for (const part of parts) {
                        if (part.includes("[POST_START]")) {
                            const content = part.split("[POST_START]")[1].trim();

                            // Parse Subreddit
                            const subMatch = content.match(/\[SUBREDDIT\]:\s*r\/([^\s\n]+)/);
                            const sub = subMatch ? subMatch[1] : "marketing";

                            // Extract title/body
                            const titleMatch = content.match(/\*\*Title:\*\*\s*(.*)/i);
                            const bodyMatch = content.match(/\*\*Body:\*\*\s*([\s\S]*?)(?=\n\n|\n\*\*Suggested|$)/i);

                            if (titleMatch || bodyMatch) {
                                // Logic: Spread across 30 days starting from tomorrow
                                const totalExpected = parseInt(params.postsPerMonth as string) || 20;
                                // Calculate gap: if 20 posts, gap is 1.5. Math.round(i * 1.5) gives 0, 2, 3, 5... which is better than 0, 1, 2, 3...
                                const gap = Math.max(1.5, 30 / Math.max(totalExpected, 1));
                                const dayOffset = Math.round(postIndex * gap);

                                const scheduledDate = new Date(today);
                                scheduledDate.setDate(today.getDate() + 1 + dayOffset);

                                const dateKey = `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, '0')}-${String(scheduledDate.getDate()).padStart(2, '0')}`;

                                const newPost = {
                                    id: `post-${postIndex}-${Date.now()}`,
                                    title: titleMatch ? titleMatch[1].trim() : "Campaign Post",
                                    body: bodyMatch ? bodyMatch[1].trim() : content,
                                    subreddit: sub,
                                    dateKey: dateKey,
                                    scheduledFor: scheduledDate.toISOString(),
                                    displayDate: `${MONTHS[scheduledDate.getMonth()]} ${scheduledDate.getDate()}`,
                                    displayTime: `${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? '30' : '00'} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
                                };

                                setGeneratedPosts(prev => [...prev, newPost]);
                                setPostCounts(prev => ({
                                    ...prev,
                                    [dateKey]: (prev[dateKey] || 0) + 1
                                }));

                                postIndex++;
                            }
                        }
                    }
                }
            }
        } catch (err: any) {
            console.error("💥 Crafting Error:", err);
            Alert.alert(
                "Phase 2 Failed",
                `Could not reach the crafting engine at 192.168.1.204:3001.`,
                [
                    { text: "Retry", onPress: () => startCrafting() },
                    { text: "Back", onPress: () => router.back(), style: "cancel" }
                ]
            );
        } finally {
            setIsCrafting(false);
        }
    };

    const daysInMonth = useMemo(() => {
        const date = new Date(year, currentMonthIndex + 1, 0);
        return date.getDate();
    }, [currentMonthIndex]);

    const firstDayOfMonth = useMemo(() => {
        const date = new Date(year, currentMonthIndex, 1);
        return date.getDay();
    }, [currentMonthIndex]);

    const calendarGrid = useMemo(() => {
        const grid = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.push({ date: 0, isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push({ date: i, isCurrentMonth: true });
        }
        return grid;
    }, [daysInMonth, firstDayOfMonth]);

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Schedule</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <Share2 size={24} color="#1E293B" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Calendar Section */}
                <View style={[styles.calendarCard, isCrafting && { opacity: 0.6 }]}>
                    <View style={styles.monthSelector}>
                        <Text style={styles.monthTitle}>{MONTHS[currentMonthIndex]} {year}</Text>
                        <View style={styles.monthNav}>
                            <TouchableOpacity
                                onPress={() => setCurrentMonthIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentMonthIndex === 0}
                            >
                                <ChevronLeft size={20} color={currentMonthIndex === 0 ? "#E2E8F0" : "#94A3B8"} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setCurrentMonthIndex(prev => Math.min(11, prev + 1))}
                                disabled={currentMonthIndex === 11}
                            >
                                <ChevronRight size={20} color={currentMonthIndex === 11 ? "#E2E8F0" : "#94A3B8"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.daysHeader}>
                        {DAYS_OF_WEEK.map((day, i) => {
                            const isTodayWeekday = new Date().getMonth() === currentMonthIndex && new Date().getDay() === i;
                            return (
                                <Text
                                    key={i}
                                    style={[
                                        styles.dayHeaderCell,
                                        isTodayWeekday && { color: "#FF4D00", fontWeight: "800" }
                                    ]}
                                >
                                    {day}
                                </Text>
                            );
                        })}
                    </View>

                    <View style={styles.daysGrid}>
                        {calendarGrid.map((cell, i) => (
                            <CalendarDay
                                key={i}
                                date={cell.date}
                                month={currentMonthIndex}
                                year={year}
                                isCurrentMonth={cell.isCurrentMonth}
                                postCounts={postCounts}
                                todayKey={today.toISOString().split('T')[0]}
                            />
                        ))}
                    </View>

                    {isCrafting && (
                        <View style={styles.craftingOverlay}>
                            <Text style={styles.craftingText}>Crafting {params.postsPerMonth} quality posts...</Text>
                        </View>
                    )}
                </View>

                {/* Posts Section */}
                <View style={styles.postsSection}>
                    <View style={styles.sectionHeading}>
                        <Text style={styles.sectionTitle}>
                            {isCrafting ? `Scanning subreddits... (${generatedPosts.length})` : "Final Drafts"}
                        </Text>
                        {!isCrafting && (
                            <TouchableOpacity>
                                <Text style={styles.viewAllText}>Regenerate All</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {generatedPosts.length > 0 ? (
                        generatedPosts.map((post) => (
                            <DraftCard
                                key={post.id}
                                subreddit={post.subreddit}
                                title={post.title}
                                scheduledFor={`${post.displayDate} · ${post.displayTime}`}
                                onPress={() => router.push({
                                    pathname: "/campaign/draft/[id]",
                                    params: {
                                        id: post.id,
                                        title: post.title,
                                        body: post.body,
                                        subreddit: post.subreddit,
                                        displayDate: post.displayDate,
                                        displayTime: post.displayTime,
                                        dateKey: post.dateKey,
                                    },
                                })}
                            />
                        ))
                    ) : (
                        isCrafting && <View style={styles.miniSkeleton} />
                    )}

                    <View style={styles.spacer} />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.publishButton, (isCrafting || generatedPosts.length === 0) && { opacity: 0.5 }]}
                    disabled={isCrafting || generatedPosts.length === 0}
                    onPress={async () => {
                        try {
                            const accounts: string[] = JSON.parse(params.accounts as string || "[]");
                            const mappedAccounts: Account[] = accounts.map(name => ({
                                id: `acc-${Math.random().toString(36).substr(2, 9)}`,
                                name,
                                karma: parseInt(params.accountKarma as string) || 0,
                                accountAge: parseInt(params.accountAge as string) || 0,
                            }));

                            const campaignId = `camp-${Date.now()}`;

                            const newCampaign: Campaign = {
                                id: campaignId,
                                name: params.name as string || "New Campaign",
                                product: params.product as string || "",
                                goal: (params.goal as any) || "discussion",
                                accounts: mappedAccounts,
                                postsPerMonth: parseInt(params.postsPerMonth as string) || 20,
                                commentsPerDay: { min: 2, max: 5 },
                                createdAt: new Date().toISOString(),
                                status: "active",
                                aiOutput: params.aiOutput as string,
                            };

                            const newActions: Action[] = generatedPosts.map((post, idx) => ({
                                id: post.id,
                                campaignId: campaignId,
                                accountId: mappedAccounts[idx % mappedAccounts.length].id,
                                type: "post",
                                status: "pending",
                                subreddit: post.subreddit,
                                title: post.title,
                                content: post.body,
                                scheduledFor: post.scheduledFor,
                            }));

                            await addCampaign(newCampaign, newActions);

                            Alert.alert(
                                "Success!",
                                `Your campaign "${newCampaign.name}" with ${newActions.length} posts has been launched.`,
                                [{ text: "Awesome", onPress: () => router.replace("/(tabs)/campaigns") }]
                            );
                        } catch (err) {
                            console.error("Failed to launch campaign:", err);
                            Alert.alert("Launch Failed", "There was an error saving your campaign. Please try again.");
                        }
                    }}
                >
                    <Text style={styles.publishButtonText}>
                        {isCrafting ? "Generating Contents..." : `Launch ${generatedPosts.length} Posts`}
                    </Text>
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
        fontSize: 18,
        fontWeight: "700",
        color: "#1E293B",
        fontFamily: "Geist-Bold",
    },
    iconButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    calendarCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    monthSelector: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 32,
    },
    monthTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1E293B",
        fontFamily: "Geist-Bold",
    },
    monthNav: {
        flexDirection: "row",
        gap: 16,
    },
    daysHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    dayHeaderCell: {
        width: 38,
        textAlign: "center",
        fontSize: 14,
        fontWeight: "600",
        color: "#94A3B8",
        fontFamily: "Geist-Bold",
    },
    daysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
    },
    daySquare: {
        width: 38,
        height: 38,
        margin: 4,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F1F5F9",
    },
    daySquareEmpty: {
        width: 38,
        height: 38,
        margin: 4,
    },
    daySquarePost: {
        backgroundColor: "#FFD8A8",
    },
    daySquareMultiple: {
        backgroundColor: "#FF4D00", // Toxic orange for multiple posts
    },
    daySquareSelected: {
        backgroundColor: "#FFD8A8",
        shadowColor: "#FF4D00",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        borderColor: "#FF4D00",
        borderWidth: 3,
    },
    multiIndicator: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#FFFFFF",
    },
    dayText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748B",
    },
    dayTextPost: {
        color: "#FF4D00",
    },
    dayTextWhite: {
        color: "#FFFFFF",
        fontWeight: "600",
    },
    dayTextToday: {
        color: "#FF4D00",
        fontWeight: "900",
    },
    dayToday: {
        borderColor: "#FF4D00",
        borderWidth: 2,
        backgroundColor: "#FFFFFF",
    },
    dayTextSelected: {
        color: "#FF4D00",
        fontWeight: "900",
    },
    postsSection: {
        marginTop: 8,
    },
    sectionHeading: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1E293B",
        fontFamily: "Geist-Bold",
    },
    viewAllText: {
        fontSize: 14,
        color: "#FF6B35",
        fontWeight: "600",
    },
    footer: {
        padding: 24,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
    },
    publishButton: {
        backgroundColor: "#FF6B35",
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    publishButtonText: {
        fontSize: 17,
        fontWeight: "800",
        color: "#FFFFFF",
        fontFamily: "Geist-Bold",
    },
    spacer: {
        height: 40,
    },
    craftingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 24,
    },
    craftingText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FF4D00",
        fontFamily: "Geist-Bold",
    },
    miniSkeleton: {
        height: 150,
        backgroundColor: "#F1F5F9",
        borderRadius: 16,
        width: "100%",
    }
});
