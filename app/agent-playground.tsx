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
} from "lucide-react-native";
import { useRouter } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Reuse the components we built


// Minimal components for the playground
const ThinkingIndicator = () => {
    return (
        <View>
            <Text style={styles.thinkingLabel}>Thinking...</Text>
        </View>
    );
};

export default function AgentPlayground() {
    const router = useRouter();
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

    const formAnim = useRef(new Animated.Value(1)).current;
    const formY = useRef(new Animated.Value(0)).current;
    const thinkingOpacity = useRef(new Animated.Value(0)).current;

    const mockSteps = [
        { title: "Analyzing Product", output: "Checking niches for your product..." },
        { title: "Scouting Subreddits", output: "\n\nFound high activity in target niches." },
        { title: "Verifying Rules", output: "\n\nScanned community guidelines for safety." },
        { title: "Drafting Content", output: "\n\nWriting native posts in your voice..." },
        { title: "Finalizing Cadence", output: "\n\nOptimal windows calculated." },
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

        for (let i = 0; i < mockSteps.length; i++) {
            await new Promise(r => setTimeout(r, 1000));

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setCurrentStep(i + 1);

            const fullNewText = mockSteps[i].output;
            for (let j = 0; j < fullNewText.length; j++) {
                setAiOutput(prev => prev + fullNewText[j]);
                await new Promise(r => setTimeout(r, 15));
            }
        }
        setIsSimulating(false);
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>UI Lab</Text>
                <TouchableOpacity onPress={reset} style={styles.resetHeaderButton}>
                    <RotateCcw size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
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
                            <TextInput style={[styles.input, styles.textArea]} value={product} onChangeText={setProduct} multiline numberOfLines={3} placeholder="What are you promoting?" />
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
                        <ThinkingIndicator />
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
    },
    thinkingLabel: {
        fontSize: 22,
        fontWeight: '400',
        fontFamily: 'Geist',
        color: '#FF6B35',
        letterSpacing: -0.5,
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
        fontSize: 17,
        lineHeight: 28,
        fontFamily: 'Geist',
        fontWeight: '400',
    },
    confirmButton: {
        marginTop: 20,
        paddingVertical: 18,
        borderRadius: 16,
        backgroundColor: '#10B981',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    resetButtonText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '600',
    },
});
