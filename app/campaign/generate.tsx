import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
    Alert,
    Animated,
    Easing,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    ChevronLeft,
} from "lucide-react-native";
import { useCampaigns } from "@/contexts/CampaignContext";
import { FormattedOutput } from "@/components/AgentUI";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ThinkingIndicator = ({ label, stepIndex }: { label?: string, stepIndex: number }) => {
    const spinValue = useRef(new Animated.Value(0)).current;
    const substepOpacity = useRef(new Animated.Value(0)).current;
    const [substepIndex, setSubstepIndex] = useState(0);

    const allSubsteps = [
        ["Searching for relevant subreddits based on your core niche.", "Identifying communities with high engagement and active daily discussions."],
        ["Decoding the unique language and 'vibe' of each community.", "Understanding common pain points and what users are actually looking for."],
        ["Deep-scanning community rules to ensure zero policy violations.", "Checking moderation history to avoid being flagged as promotional."],
        ["Architecting posts that sound like a real community member, not an AI.", "Refining drafts to match your specific narrative voice and tone."],
        ["Calculating the exact peak hours for maximum visibility.", "Staggering posts to maintain a natural, human-like activity pattern."]
    ];

    const currentSubsteps = allSubsteps[Math.max(0, Math.min(stepIndex - 1, 4))];

    useEffect(() => {
        const startSpinning = () => {
            spinValue.setValue(0);
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(() => startSpinning());
        };
        startSpinning();
    }, []);

    useEffect(() => {
        let isMounted = true;
        const cycleSubsteps = async () => {
            while (isMounted) {
                await new Promise(r => Animated.timing(substepOpacity, { toValue: 0, duration: 800, useNativeDriver: true }).start(r));
                if (!isMounted) break;
                setSubstepIndex(prev => (prev + 1) % currentSubsteps.length);
                await new Promise(r => Animated.timing(substepOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start(r));
                await new Promise(r => setTimeout(r, 3000));
            }
        };
        cycleSubsteps();
        return () => { isMounted = false; };
    }, [stepIndex]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.thinkingWrapper}>
            <View style={styles.thinkingContainer}>
                <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
                <Text style={styles.thinkingLabel}>{label || "Thinking..."}</Text>
            </View>
            <Animated.View style={{ opacity: substepOpacity, marginTop: 12 }}>
                <Text style={styles.substepText}>{currentSubsteps[substepIndex]}</Text>
            </Animated.View>
        </View>
    );
};

export default function GenerationScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { addCampaign } = useCampaigns();

    const [currentStep, setCurrentStep] = useState(1);
    const [aiOutput, setAiOutput] = useState("");
    const [isGenerating, setIsGenerating] = useState(true);
    const [isFinished, setIsFinished] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        startGeneration();
    }, []);

    const startGeneration = async () => {
        try {
            const response = await fetch('http://192.168.1.204:3001/api/generate-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: params.name,
                    productDescription: params.product,
                    userGoal: params.goal,
                }),
            });

            if (!response.ok) throw new Error('Failed to generate campaign');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);

                    setAiOutput((prev) => {
                        const next = prev + chunk;
                        updateSteps(next);
                        return next;
                    });
                }
            }

            setIsGenerating(false);
            setIsFinished(true);
            setCurrentStep(5);
        } catch (error: any) {
            console.error("Generation error:", error);
            setIsGenerating(false);
            Alert.alert(
                "Connection Failed",
                `Could not reach the campaign engine at 192.168.1.204:3001.\n\nDetails: ${error.message}`,
                [
                    { text: "Retry", onPress: () => startGeneration() },
                    { text: "OK", style: "cancel" }
                ]
            );
        }
    };

    const updateSteps = (text: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        // Listen for modern [STEP:X] markers
        const stepMatch = text.match(/\[STEP:(\d+)\]/g);
        if (stepMatch) {
            const lastStep = stepMatch[stepMatch.length - 1];
            const stepNum = parseInt(lastStep.match(/\d+/)?.[0] || "1");
            setCurrentStep(stepNum);
        }

        // Map Orchestrator headers to UI Steps
        if (text.includes("ANALYZING PRODUCT")) setCurrentStep(1);
        if (text.includes("SCOUTING SUBREDDITS") || text.includes("TARGET SUBREDDITS")) setCurrentStep(2);
        if (text.includes("RULES") || text.includes("SAFETY RATING")) setCurrentStep(3);
        if (text.includes("DRAFTING POSTS") || text.includes("READY-TO-POST")) setCurrentStep(4);
        if (text.includes("CALCULATING PEAK TIMING") || text.includes("SCHEDULING (GMT 0)")) setCurrentStep(5);
    };

    const handleConfirm = () => {
        router.push({
            pathname: "/campaign/review",
            params: {
                ...params,
                aiOutput: aiOutput
            }
        });
    };

    const parseCampaignOutput = (text: string, campaignId: string, accountId: string): any[] => {
        const actions: any[] = [];
        const subredditBlocks = text.split(/## 📍 r\//g).slice(1);
        subredditBlocks.forEach(block => {
            try {
                const firstLine = block.split('\n')[0];
                const subreddit = firstLine.replace(/[#*\s]/g, '').trim();
                const titleMatch = block.match(/\*\*Title:\*\* (.*)/);
                const title = titleMatch ? titleMatch[1].trim() : "Reddit Campaign Post";
                const bodyPart = block.split(/\*\*Body:\*\*/i)[1];
                const body = bodyPart ? bodyPart.split(/\*\*\🛡️|\*\*\📅|\*\*\⚡/)[0].trim() : "";
                if (subreddit && body) {
                    actions.push({
                        id: `action-${Math.random().toString(36).substr(2, 9)}`,
                        campaignId,
                        accountId,
                        type: 'post',
                        status: 'pending',
                        subreddit,
                        title,
                        content: body,
                        scheduledFor: new Date(Date.now() + 86400000).toISOString(),
                    });
                }
            } catch (e) { }
        });
        return actions;
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1: return "Scouting target communities...";
            case 2: return "Analyzing local sentiment...";
            case 3: return "Verifying safety guidelines...";
            case 4: return "Generating native drafts...";
            case 5: return "Architecting post schedule...";
            default: return "Strategizing...";
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace("/(tabs)");
                        }
                    }}
                    style={styles.backButton}
                >
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Campaign Generation</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                ref={scrollRef}
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
                {isGenerating ? (
                    <ThinkingIndicator
                        label={getStepTitle()}
                        stepIndex={currentStep}
                    />
                ) : (
                    <View style={styles.finalHeader}>
                        <Text style={styles.finalTitle}>Campaign Strategy Ready</Text>
                    </View>
                )}

                <View style={styles.outputContainer}>
                    {!isGenerating && aiOutput ? (
                        <FormattedOutput text={aiOutput} />
                    ) : (
                        <View style={{ height: 20 }} />
                    )}
                </View>

                {isFinished && (
                    <View style={styles.footerSpacing} />
                )}
            </ScrollView>

            {isFinished && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                        <Text style={styles.confirmButtonText}>Craft {params.postsPerMonth || "0"} Posts</Text>
                    </TouchableOpacity>
                </View>
            )}
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
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1E293B",
        fontFamily: "Geist-Bold",
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    thinkingWrapper: {
        width: '100%',
        marginBottom: 32,
    },
    thinkingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    spinner: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#FF6B35',
        borderStyle: 'dashed',
    },
    thinkingLabel: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FF6B35',
        letterSpacing: -0.5,
        fontFamily: "Geist-Bold",
    },
    substepText: {
        fontSize: 16,
        color: '#64748B',
        lineHeight: 24,
        fontFamily: "Geist",
    },
    finalHeader: {
        marginBottom: 24,
    },
    finalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        fontFamily: "Geist-Bold",
    },
    outputContainer: {
        width: '100%',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
    },
    confirmButton: {
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
    confirmButtonText: {
        fontSize: 17,
        fontWeight: "800",
        color: "#FFFFFF",
        fontFamily: "Geist-Bold",
    },
    footerSpacing: {
        height: 40,
    }
});
