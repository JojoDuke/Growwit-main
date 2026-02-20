import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
    SafeAreaView,
    TextInput,
    Easing,
} from 'react-native';
import {
    Bot,
    Sparkles,
    Brain,
    Search,
    ShieldCheck,
    Zap,
    Clock,
    ArrowLeft,
    Play,
    RotateCcw,
    Plus,
    ChevronDown,
    Copy,
} from "lucide-react-native";
import { useRouter } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Reuse the components we built


// Minimal components for the playground
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
                // Fade out
                await new Promise(r => Animated.timing(substepOpacity, { toValue: 0, duration: 800, useNativeDriver: true }).start(r));
                if (!isMounted) break;

                setSubstepIndex(prev => (prev + 1) % currentSubsteps.length);

                // Fade in
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

const CollapsibleThought = ({ title, content }: { title: string, content: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={styles.thoughtContainer}>
            <TouchableOpacity
                style={styles.thoughtHeader}
                onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsOpen(!isOpen);
                }}
                activeOpacity={0.7}
            >
                <View style={styles.thoughtLeft}>
                    <Text style={styles.thoughtTitle}>{title}</Text>
                </View>
                <ChevronDown size={18} color="#94A3B8" style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>
            {isOpen && (
                <View style={styles.thoughtBody}>
                    <ScrollView
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                        style={{ maxHeight: 350 }}
                    >
                        <FormattedOutput text={content} isInsideCollapse />
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const DraftCard = ({ title, content, subreddit }: { title: string, content: string, subreddit?: string }) => {
    return (
        <View style={styles.draftCard}>
            <View style={styles.draftCardSubredditRow}>
                <View style={styles.subredditBadge}>
                    <Text style={styles.subredditBadgeText}>r/{subreddit || "community"}</Text>
                </View>
                <View style={styles.draftCardActions}>
                    <TouchableOpacity style={styles.draftActionButton}>
                        <Copy size={14} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.draftScheduleInfo}>
                <Text style={styles.draftScheduleLabel}>Scheduled For:</Text>
                <Text style={styles.draftScheduleValue}>Mon, Feb 24 • 2:00 PM</Text>
            </View>

            <View style={styles.draftDivider} />

            <View style={styles.draftField}>
                <Text style={styles.draftLabel}>TITLE</Text>
                <Text style={styles.draftValue}>{title}</Text>
            </View>

            <View style={styles.draftField}>
                <Text style={styles.draftLabel}>BODY</Text>
                <Text style={styles.draftValue} numberOfLines={5}>{content}</Text>
            </View>
        </View>
    );
};

const FormattedOutput = ({ text, isInsideCollapse = false }: { text: string, isInsideCollapse?: boolean }) => {
    // Split by handoffs to group by agent
    const parts = text.split(/(--- 🤖 HANDING OFF TO .*? ---)/g);

    const renderBlock = (content: string, index: number) => {
        // Step 1: Aggressive word rejoining. 
        // We look for any newline that is NOT followed by another newline 
        // (optionally with some spaces) and replace it with a space.
        const normalized = content
            .replace(/\r/g, '') // Clean carriage returns
            .replace(/([^\n])\n([^\n])/g, '$1 $2') // Pass 1: standard join
            .replace(/([^\n])\n([^\n])/g, '$1 $2') // Pass 2: catch overlaps
            .replace(/\s+\n/g, '\n') // Clean trailing spaces before newlines
            .replace(/\n\s+/g, '\n') // Clean leading spaces after newlines
            .trim();

        // Legitimate paragraphs are separated by double newlines or more
        const blocks = normalized.split(/\n\n+/);

        return (
            <View key={index} style={styles.contentBlock}>
                {blocks.map((block, bIdx) => {
                    const trimmed = block.trim();
                    if (!trimmed) return null;

                    // Headers
                    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
                        const hText = trimmed.replace(/^#+\s*/, '').replace(/\*/g, '').trim();
                        return <Text key={`h-${bIdx}`} style={trimmed.startsWith('## ') ? styles.h2 : styles.h3}>{hText}</Text>;
                    }

                    // Flexible Label Detection
                    const labelPattern = /^\**([a-zA-Z\s]{2,20}):\**\s*(.*)/is;
                    const match = trimmed.match(labelPattern);

                    if (match) {
                        const label = match[1].trim();
                        // Also cleanup the value specifically
                        const value = match[2].trim().replace(/\*\*/g, '').replace(/\n+/g, ' ');

                        return (
                            <View key={`l-${bIdx}`} style={styles.labelItem}>
                                <Text style={styles.boldLabel}>{label}:</Text>
                                {value ? (
                                    <Text style={styles.labelText}>{value}</Text>
                                ) : null}
                            </View>
                        );
                    }

                    // Bullet points
                    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
                        const bText = trimmed.replace(/^[-•*]\s*/, '').replace(/\n+/g, ' ').trim();
                        return (
                            <View key={`b-${bIdx}`} style={styles.bulletRow}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.bulletText}>{bText}</Text>
                            </View>
                        );
                    }

                    // Standard Text (Heal any remaining internal newlines)
                    const cleanedBlock = trimmed.replace(/\n+/g, ' ');
                    return (
                        <Text key={`p-${bIdx}`} style={isInsideCollapse ? styles.thoughtText : styles.paragraphLine}>
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
        <View style={styles.formattedContainer}>
            {parts.map((part, index) => {
                const trimmedPart = part.trim();
                if (!trimmedPart) return null;

                const isHandoff = trimmedPart.includes('--- 🤖 HANDING OFF TO');

                if (index === 0) {
                    // Always collapse the primary research phase
                    return <CollapsibleThought key={index} title="Phase 1: Strategist Agent" content={trimmedPart} />;
                }

                if (isHandoff) return null; // Markers are handled by the logic below

                // Identify previous marker for context
                const prevMarker = parts[index - 1] || "";

                if (prevMarker.includes('WRITER')) {
                    // Split the part by subreddit markers to find all drafts
                    const draftBlocks = trimmedPart.split(/## 📍 r\//g).slice(1);

                    return (
                        <View key={index} style={styles.resultContainer}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionHeaderText}>Campaign Drafts</Text>
                            </View>
                            {draftBlocks.map((block, bIdx) => {
                                const sub = block.split('\n')[0].trim();
                                const titleMatch = block.match(/\*\*Title:\*\* (.*)/);
                                const bodyMatch = block.match(/\*\*Body:\*\* ([\s\S]*?)(?=\n\n##|$)/);

                                return (
                                    <DraftCard
                                        key={bIdx}
                                        subreddit={sub}
                                        title={titleMatch ? titleMatch[1] : "Draft Title"}
                                        content={bodyMatch ? bodyMatch[1].trim() : "Draft Body"}
                                    />
                                );
                            })}
                        </View>
                    );
                }

                if (prevMarker.includes('CADENCE')) {
                    return (
                        <View key={index} style={styles.resultContainer}>
                            <View style={styles.sectionHeaderRow}>
                                <Clock size={18} color="#10B981" />
                                <Text style={styles.sectionHeaderText}>Scheduling Profile</Text>
                            </View>
                            {renderBlock(trimmedPart, index)}
                        </View>
                    );
                }

                return renderBlock(trimmedPart, index);
            })}
        </View>
    );
};

export default function AgentPlayground() {
    const playgroundRouter = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [aiOutput, setAiOutput] = useState("");
    const [isSimulating, setIsSimulating] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    // Form states
    const [name, setName] = useState("");
    const [product, setProduct] = useState("");
    const [goal, setGoal] = useState("discussion");
    const [accountAge, setAccountAge] = useState("");
    const [accountKarma, setAccountKarma] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accounts, setAccounts] = useState<string[]>([]);
    const [postsPerMonth, setPostsPerMonth] = useState("30");

    const formAnim = useRef(new Animated.Value(1)).current;
    const formY = useRef(new Animated.Value(0)).current;
    const thinkingOpacity = useRef(new Animated.Value(0)).current;

    const mockSteps = [
        { title: "Scouting target communities...", output: "Checking niches for your product..." },
        { title: "Analyzing local sentiment...", output: "\n\nFound high activity in target niches." },
        { title: "Verifying safety guidelines...", output: "\n\nScanned community guidelines for safety." },
        { title: "Generating native drafts...", output: "\n\nWriting native posts in your voice..." },
        { title: "Architecting post schedule...", output: "\n\nOptimal windows calculated." },
    ];

    const startSimulation = async () => {
        // 1. Start fade and slide down
        Animated.parallel([
            Animated.timing(formAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            Animated.timing(formY, { toValue: 50, duration: 600, useNativeDriver: true }),
            Animated.timing(thinkingOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]).start();

        await new Promise(r => setTimeout(r, 600));

        setIsSimulating(true);
        setCurrentStep(1);
        setAiOutput("");

        try {
            const mockResponse = `[STEP:1]
## 🚀 Strategy: Native Community Growth
I've analyzed your product and identified 3 key communities where your target audience lives.

### Target Subreddits:
- r/softwareengineering: Focus on productivity and meal prep for devs.
- r/productivity: Pivot to "brain-fuel" and focus on zero-friction.
- r/mealprep: Emphasize the nutritional data for the "logic-driven" user.

[STEP:2]
I'm now identifying common pain points. User sentiment suggests a strong desire for "macros-first" planning without the visual clutter of traditional apps. We will frame Zest AI as a "CLI for your kitchen".

--- 🤖 HANDING OFF TO WRITER AGENT ---

[STEP:3]
I am performing a safety check against subreddit-specific rules...
- r/softwareengineering: Avoid direct promo. Focus on "Show & Tell".
- r/productivity: Rules allow "Weekly Tool" discussions.
Checks passed. Generating native drafts...

[STEP:4]
## 📍 r/softwareengineering
**Title:** I built a meal planner for my own dev burnout, looking for feedback
**Body:** Hey everyone, I've been struggling with balancing sprints and eating actual food. I built a small tool that hooks into my calendar and just gives me a grocery list based on my macros. No ads, no fluff. Looking for 5 people who want to break it...

## 📍 r/productivity
**Title:** The "Zero Decision" meal strategy for deep work
**Body:** Most planners take too much time to manage. I'm testing an AI that does the planning for you so you can stay in flow state. If you hate tracking calories but want the results, check this out.

--- 🤖 HANDING OFF TO CADENCE AGENT ---

[STEP:5]
Optimal posting windows calculated in UTC:
- r/softwareengineering: Tuesday 2:00 PM (Peak dev break time)
- r/productivity: Monday 9:00 AM (Start of week planning)
- r/mealprep: Sunday 4:00 PM (Preparation window)`;

            let accumulatedText = "";
            const chunks = mockResponse.split("\n");

            for (const chunk of chunks) {
                // Simulate network/thinking delay
                await new Promise(r => setTimeout(r, 600));

                accumulatedText += chunk + "\n";

                // Update current step based on markers
                const allSteps = [...accumulatedText.matchAll(/\[STEP:(\d)\]/g)];
                if (allSteps.length > 0) {
                    const lastStep = allSteps[allSteps.length - 1][1];
                    const stepNum = parseInt(lastStep);
                    if (stepNum > currentStep) {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setCurrentStep(stepNum);
                    }
                }
            }

            const finalCleanOutput = accumulatedText.replace(/\[STEP:\d\]/g, "").trim();
            setAiOutput(finalCleanOutput);

        } catch (error) {
            console.error('Simulation Error:', error);
            setAiOutput("Error: Simulator encountered an issue.");
        } finally {
            setIsSimulating(false);
            setCurrentStep(6); // Mark as complete
        }
    };

    const reset = () => {
        formAnim.setValue(1);
        formY.setValue(0);
        thinkingOpacity.setValue(0);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCurrentStep(0);
        setAiOutput("");
        setIsSimulating(false);
    };

    const triggerTestRun = () => {
        setName("Zest AI");
        setProduct("AI meal planner for busy software engineers. Looking for 5 beta testers to try it out!");
        setGoal("discussion");
        setAccountAge("90");
        setAccountKarma("1500");
        setAccounts(["u/ZestChef"]);
    };

    const addAccount = () => {
        if (accountName.trim()) {
            setAccounts([...accounts, accountName.trim()]);
            setAccountName("");
        }
    };

    const getStepTitle = () => {
        if (currentStep === 0) return "";
        if (currentStep > mockSteps.length) return "Campaign Strategy Ready";
        return mockSteps[currentStep - 1].title;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (currentStep > 0) {
                            reset();
                        } else if (playgroundRouter.canGoBack()) {
                            playgroundRouter.back();
                        } else {
                            playgroundRouter.replace("/");
                        }
                    }}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>UI Lab</Text>
                <TouchableOpacity onPress={reset} style={styles.resetHeaderButton}>
                    <RotateCcw size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={[styles.content, currentStep > 0 && { flex: 1 }]}
            >
                {currentStep === 0 ? (
                    <Animated.View style={[styles.formSection, { opacity: formAnim, transform: [{ translateY: formY }] }]}>
                        <View style={styles.instructionCard}>
                            <Sparkles size={20} color="#FF6B35" />
                            <Text style={styles.instructionText}>
                                Fill out the form or use the test button to trigger the agent simulation.
                            </Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Campaign Name</Text>
                            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Launch Product X" />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Product/Service</Text>
                            <TextInput style={[styles.input, styles.textArea]} value={product} onChangeText={setProduct} multiline numberOfLines={3} placeholder="What are you promoting? Be as detailed as possible" />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Goal</Text>
                            <View style={styles.goalButtons}>
                                {["discussion", "dms", "profile"].map((g) => (
                                    <TouchableOpacity key={g} style={[styles.goalButton, goal === g && styles.goalButtonActive]} onPress={() => setGoal(g)}>
                                        <Text style={[styles.goalButtonText, goal === g && styles.goalButtonTextActive]}>{g}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Age (Days)</Text>
                                <TextInput style={styles.input} value={accountAge} onChangeText={setAccountAge} keyboardType="number-pad" placeholder="30" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Karma</Text>
                                <TextInput style={styles.input} value={accountKarma} onChangeText={setAccountKarma} keyboardType="number-pad" placeholder="500" />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Monthly Post Goal (Max 100)</Text>
                            <TextInput
                                style={styles.input}
                                value={postsPerMonth}
                                onChangeText={(val) => {
                                    const num = parseInt(val) || 0;
                                    if (num <= 100) setPostsPerMonth(val);
                                    else setPostsPerMonth("100");
                                }}
                                keyboardType="number-pad"
                                placeholder="30"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Accounts</Text>
                            <View style={styles.accountInputRow}>
                                <TextInput style={[styles.input, styles.accountInput]} value={accountName} onChangeText={setAccountName} placeholder="u/name" />
                                <TouchableOpacity style={styles.addAccountButton} onPress={addAccount}><Plus size={20} color="#FF6B35" /></TouchableOpacity>
                            </View>
                            <View style={styles.accountsList}>
                                {accounts.map((acc, idx) => (
                                    <View key={idx} style={styles.accountChip}>
                                        <Text style={styles.accountChipText}>{acc}</Text>
                                        <TouchableOpacity onPress={() => setAccounts(accounts.filter((_, i) => i !== idx))}><Text>×</Text></TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity style={styles.mainButton} onPress={startSimulation}>
                            <Text style={styles.mainButtonText}>Generate Campaign</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={triggerTestRun}>
                            <Text style={styles.secondaryButtonText}>Auto-fill Zest AI (Test)</Text>
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <View style={styles.prototypeContainer}>
                        {isSimulating ? (
                            <ThinkingIndicator
                                label={getStepTitle()}
                                stepIndex={currentStep}
                            />
                        ) : (
                            <View>
                                <View style={styles.headerRow}>
                                    <Text style={styles.finalTitle}>Campaign Strategy Ready</Text>
                                </View>

                                <ScrollView style={[styles.chatScroll, { marginTop: 12 }]} showsVerticalScrollIndicator={false}>
                                    <FormattedOutput text={aiOutput} />

                                    <TouchableOpacity
                                        style={styles.confirmButton}
                                        onPress={reset}
                                    >
                                        <Text style={styles.confirmButtonText}>Create Another</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Geist-Bold',
        color: '#1E293B',
    },
    resetHeaderButton: {
        padding: 8,
    },
    content: {
        padding: 20,
    },
    instructionCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        color: '#64748B',
    },
    formSection: {
        width: '100%',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        fontFamily: 'Geist-SemiBold',
        color: "#1E293B",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'Geist',
        color: "#1E293B",
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    goalButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    goalButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    goalButtonActive: {
        backgroundColor: "#FFF1ED",
        borderColor: "#FF6B35",
    },
    goalButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#64748B",
        textTransform: "capitalize",
    },
    goalButtonTextActive: {
        color: "#FF6B35",
    },
    accountInputRow: {
        flexDirection: "row",
        gap: 8,
    },
    accountInput: {
        flex: 1,
    },
    addAccountButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "#FFF1ED",
        alignItems: "center",
        justifyContent: "center",
    },
    accountsList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 12,
    },
    accountChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    accountChipText: {
        fontSize: 14,
        color: "#1E293B",
    },
    mainButton: {
        backgroundColor: "#FF6B35",
        borderRadius: 12,
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    mainButtonText: {
        fontSize: 16,
        fontWeight: "800",
        fontFamily: 'Geist-Bold',
        color: "#FFFFFF",
    },
    secondaryButton: {
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
    },
    secondaryButtonText: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: 'Geist',
        fontWeight: '600',
    },
    prototypeContainer: {
        width: '100%',
        paddingTop: 40,
        flex: 1,
    },
    thinkingWrapper: {
        width: '100%',
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
        fontFamily: 'Geist-Bold',
        color: '#FF6B35',
        letterSpacing: -0.5,
    },
    substepText: {
        fontSize: 16,
        color: '#64748B',
        fontFamily: 'Geist',
        lineHeight: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    finalTitle: {
        fontSize: 20,
        fontWeight: '800',
        fontFamily: 'Geist-Bold',
        color: '#1E293B',
    },
    chatScroll: {
        flex: 1,
    },
    chatScrollContent: {
        paddingBottom: 20,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 17,
    },
    aiBubbleText: {
        color: '#334155',
        fontSize: 16,
        lineHeight: 26,
        fontFamily: 'Geist',
        fontWeight: '400',
    },
    // Formatted Output Styles
    formattedContainer: {
        width: '100%',
    },
    contentBlock: {
        marginBottom: 16,
    },
    h2: {
        fontSize: 19,
        fontWeight: '800',
        fontFamily: 'Geist-Bold',
        color: '#1E293B',
        marginTop: 16,
        marginBottom: 8,
    },
    h3: {
        fontSize: 17,
        fontWeight: '700',
        fontFamily: 'Geist-SemiBold',
        color: '#475569',
        marginTop: 12,
        marginBottom: 4,
    },
    labelRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    labelItem: {
        marginBottom: 8,
    },
    boldLabel: {
        fontWeight: '800',
        fontFamily: 'Geist-Bold',
        color: '#1E293B',
        fontSize: 16,
        marginBottom: 2,
    },
    labelText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#475569',
    },
    paragraphLine: {
        fontSize: 16,
        lineHeight: 24,
        color: '#475569',
        marginBottom: 8,
    },
    bulletRow: {
        flexDirection: 'row',
        paddingLeft: 8,
        marginBottom: 6,
    },
    bullet: {
        fontSize: 18,
        color: '#FF6B35',
        marginRight: 8,
    },
    bulletText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#475569',
        flex: 1,
    },
    resultContainer: {
        marginTop: 16,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 4,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: '800',
        fontFamily: 'Geist-Bold',
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Thought Styles
    thoughtContainer: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    thoughtHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    thoughtLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    thoughtTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    thoughtBody: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 10,
        height: 'auto',
    },
    thoughtText: {
        fontSize: 13,
        color: '#64748B',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    confirmButton: {
        marginTop: 20,
        paddingVertical: 18,
        borderRadius: 16,
        backgroundColor: '#FF6B35',
        alignItems: 'center',
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 40,
    },
    resetButtonText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '600',
    },
    // Draft Card Styles
    draftCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    draftCardSubredditRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    subredditBadge: {
        backgroundColor: '#FFF1ED',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FF6B3520',
    },
    subredditBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FF6B35',
        fontFamily: 'Geist-Bold',
    },
    draftCardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    draftActionButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    draftField: {
        marginBottom: 12,
    },
    draftLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 4,
        fontFamily: 'Geist-Bold',
    },
    draftValue: {
        fontSize: 15,
        color: '#1E293B',
        lineHeight: 22,
        fontFamily: 'Geist',
    },
    draftDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 12,
    },
    draftScheduleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 4,
    },
    draftScheduleLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        fontFamily: 'Geist-Bold',
    },
    draftScheduleValue: {
        fontSize: 12,
        color: '#475569',
        fontFamily: 'Geist',
    },
});
