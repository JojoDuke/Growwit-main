import { useCampaigns } from "@/contexts/CampaignContext";
import { Campaign } from "@/types";
import { router, Href } from "expo-router";

import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  PanResponder,
  Alert,
  Linking,
  Platform,
  UIManager,
  LayoutAnimation,
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Target,
  Plus,
  ExternalLink,
  ShieldCheck,
  Brain,
  Bot,
  Sparkles,
  Search,
  Zap
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, isToday, parseISO } from "date-fns";
import { useRef, useEffect } from "react";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { campaigns, actions, addCampaign, completeAction } = useCampaigns();
  const [showNewCampaignModal, setShowNewCampaignModal] = useState<boolean>(false);

  const todayActions = useMemo(() => {
    return actions.filter((action) => {
      if (!action.scheduledFor) return false;
      const scheduledDate = parseISO(action.scheduledFor);
      return isToday(scheduledDate) && action.status === "pending";
    });
  }, [actions]);

  const recentCompleted = useMemo(() => {
    return actions
      .filter((a) => a.status === "completed" && a.completedAt)
      .sort((a, b) => {
        const dateA = parseISO(a.completedAt!);
        const dateB = parseISO(b.completedAt!);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 3);
  }, [actions]);

  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowNewCampaignModal(true)}
        activeOpacity={0.7}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={todayActions.length === 0 ? styles.scrollViewContent : undefined}
        showsVerticalScrollIndicator={false}
      >
        {todayActions.length > 0 ? (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, styles.topSectionHeader]}>
              <Text style={styles.sectionTitle}>Ready to Post</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.actionCount}>{todayActions.length}</Text>
              <View style={{ width: 64 }} />
            </View>
            {todayActions.map((action) => {
              const campaign = campaigns.find((c) => c.id === action.campaignId);
              return (
                <ActionCard
                  key={action.id}
                  action={action}
                  campaign={campaign}
                  onComplete={completeAction}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Clock size={48} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No actions scheduled</Text>
            <Text style={styles.emptyDescription}>
              {activeCampaigns.length === 0
                ? "Create a campaign to start generating posts"
                : "Check back later for scheduled posts"}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowNewCampaignModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.createButtonText}>Create Campaign</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: '#FF6B35', borderColor: '#FF6B35' }]}
              onPress={() => {
                router.push('/agent-playground' as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.testButtonText, { color: '#FFF' }]}>UI Lab (Prototyping)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                setShowNewCampaignModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.testButtonText}>Test Strategist (Zest AI)</Text>
            </TouchableOpacity>
          </View>
        )}

        {recentCompleted.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentCompleted.map((action) => {
              const campaign = campaigns.find((c) => c.id === action.campaignId);
              return (
                <View key={action.id} style={styles.activityCard}>
                  <View style={styles.activityIcon}>
                    <CheckCircle2 size={16} color="#10B981" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityType}>
                      {action.type === "post" ? "Posted" : "Commented"} in r/{action.subreddit}
                    </Text>
                    <Text style={styles.activityCampaign}>{campaign?.name || "Unknown"}</Text>
                  </View>
                  <Text style={styles.activityTime}>
                    {action.completedAt
                      ? format(parseISO(action.completedAt), "h:mm a")
                      : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {activeCampaigns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Campaigns</Text>
              <TouchableOpacity onPress={() => setShowNewCampaignModal(true)}>
                <Text style={styles.seeAll}>Create New</Text>
              </TouchableOpacity>
            </View>
            {activeCampaigns.slice(0, 3).map((campaign) => (
              <TouchableOpacity
                key={campaign.id}
                style={styles.campaignCard}
                onPress={() => router.push(`/campaign/${campaign.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.campaignIcon}>
                  <Target size={20} color="#FF6B35" />
                </View>
                <View style={styles.campaignInfo}>
                  <Text style={styles.campaignName}>{campaign.name}</Text>
                  <Text style={styles.campaignProduct} numberOfLines={1}>
                    {campaign.product}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <NewCampaignModal
        visible={showNewCampaignModal}
        onClose={() => setShowNewCampaignModal(false)}
        onGenerate={async (campaign, onStreamChunk) => {
          let fullOutput = "";
          const response = await fetch('http://localhost:3001/api/generate-campaign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productName: campaign.name,
              productDescription: campaign.product,
              userGoal: campaign.goal,
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
              fullOutput += chunk;
              onStreamChunk(chunk);
            }
          }
          return fullOutput;
        }}
        onSave={async (campaign, fullOutput) => {
          // Parse the full output to extract actions
          const initialActions = parseCampaignOutput(fullOutput, campaign.id, campaign.accounts[0].id);
          await addCampaign(campaign, initialActions);
        }}
      />
    </SafeAreaView>
  );
}

/**
 * Robust regex parser to convert the Orchestrator's structured text 
 * into Action objects for the CampaignContext.
 */
function parseCampaignOutput(text: string, campaignId: string, accountId: string): any[] {
  const actions: any[] = [];

  // Use regex to find "## 📍 r/SubredditName" blocks
  const subredditBlocks = text.split(/## 📍 r\//g).slice(1);

  subredditBlocks.forEach(block => {
    try {
      const firstLine = block.split('\n')[0];
      const subreddit = firstLine.replace(/[#*\s]/g, '').trim();

      const titleMatch = block.match(/\*\*Title:\*\* (.*)/);
      const title = titleMatch ? titleMatch[1].trim() : "Reddit Campaign Post";

      // Extract body between "**Body:**" and the next bold marker (Safety or Scheduling)
      const bodyPart = block.split(/\*\*Body:\*\*/i)[1];
      const body = bodyPart ? bodyPart.split(/\*\*\🛡️|\*\*\📅|\*\*\⚡/)[0].trim() : "";

      if (subreddit && body) {
        actions.push({
          id: `action-ai-${Date.now()}-${actions.length}`,
          campaignId,
          accountId,
          type: 'post',
          status: 'pending',
          subreddit,
          title,
          content: body,
          scheduledFor: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("Error parsing subreddit block:", e);
    }
  });

  return actions;
}

const AgentStatus = ({ step, status }: { step: number; status: string }) => {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.4, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.1, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const getStepIcon = (s: number) => {
    switch (s) {
      case 1: return <Brain size={20} color="#FF6B35" />;
      case 2: return <Search size={20} color="#FF6B35" />;
      case 3: return <ShieldCheck size={20} color="#FF6B35" />;
      case 4: return <Zap size={20} color="#FF6B35" />;
      case 5: return <Clock size={20} color="#FF6B35" />;
      default: return <Sparkles size={20} color="#FF6B35" />;
    }
  };

  return (
    <View style={styles.thinkingHeader}>
      <View style={styles.agentAvatarContainer}>
        <Animated.View style={[styles.agentPulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
        <View style={styles.agentAvatar}>
          <Bot size={28} color="#FFF" />
        </View>
      </View>
      <View style={styles.thinkingInfo}>
        <Text style={styles.thinkingStatus}>{status}</Text>
        <View style={styles.activeStepContainer}>
          {getStepIcon(step)}
          <Text style={styles.activeStepLabel}>Step {step} of 5</Text>
        </View>
      </View>
    </View>
  );
};

const ThinkingDots = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (val: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    };
    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
};

const ProgressBar = ({ step }: { step: number }) => {
  const width = (step / 5) * 100;
  return (
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${width}%` }]} />
    </View>
  );
};

function NewCampaignModal({
  visible,
  onClose,
  onGenerate,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onGenerate: (campaign: Campaign, onStreamChunk: (chunk: string) => void) => Promise<string>;
  onSave: (campaign: Campaign, output: string) => Promise<void>;
}) {
  const [generatedCampaign, setGeneratedCampaign] = useState<Campaign | null>(null);
  const [name, setName] = useState<string>("");
  const [product, setProduct] = useState<string>("");
  const [goal, setGoal] = useState<string>("discussion");
  const [accountAge, setAccountAge] = useState<string>("");
  const [accountKarma, setAccountKarma] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [postsPerMonth, setPostsPerMonth] = useState<string>("50");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    { id: 1, label: "Analyzing Product & Goal", icon: "target" },
    { id: 2, label: "Scouting Target Subreddits", icon: "search" },
    { id: 3, label: "Scraping Community Rules", icon: "shield" },
    { id: 4, label: "Generating Strategy & Post Drafts", icon: "edit" },
    { id: 5, label: "Calculating Peak Cadence", icon: "clock" },
  ];

  const triggerTestRun = () => {
    setName("Zest AI");
    setProduct("AI meal planner for busy software engineers. Looking for 5 beta testers to try it out!");
    setGoal("discussion");
    setAccountAge("90");
    setAccountKarma("1500");
    setAccounts(["u/ZestChef"]);
  };

  const isFormValid = name.trim() !== "" &&
    product.trim() !== "" &&
    goal !== "" &&
    accountAge !== "" &&
    accountKarma !== "" &&
    postsPerMonth !== "" &&
    accounts.length > 0;

  const handleSubmit = async () => {
    if (!name || !product || accounts.length === 0) return;

    setIsGenerating(true);
    setCurrentStep(1);
    setAiOutput("");

    const updateSteps = (text: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (text.includes("TARGET SUBREDDITS")) setCurrentStep(2);
      if (text.includes("RULES") || text.includes("SAFETY")) setCurrentStep(3);
      if (text.includes("READY-TO-POST")) setCurrentStep(4);
      if (text.includes("SCHEDULING") || text.includes("GMT")) setCurrentStep(5);
    };

    const campaign: Campaign = {
      id: `campaign-${Date.now()}`,
      name,
      product,
      goal: goal as Campaign["goal"],
      accounts: accounts.map((acc, idx) => ({
        id: `account-${idx}`,
        name: acc,
        karma: parseInt(accountKarma) || 0,
        accountAge: parseInt(accountAge) || 0,
      })),
      postsPerMonth: parseInt(postsPerMonth) || 50,
      commentsPerDay: { min: 3, max: 7 },
      createdAt: new Date().toISOString(),
      status: "active",
    };

    setGeneratedCampaign(campaign);

    try {
      await onGenerate(campaign, (chunk) => {
        setAiOutput((prev) => prev + chunk);
        updateSteps(chunk);
      });
      setCurrentStep(6);
      /* 
       Wait for user manual confirmation. 
       Do NOT auto-close. 
      */
    } catch (error) {
      Alert.alert("Error", "Failed to generate campaign.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setGeneratedCampaign(null);
    setName("");
    setProduct("");
    setGoal("discussion");
    setAccountAge("");
    setAccountKarma("");
    setAccountName("");
    setAccounts([]);
    setPostsPerMonth("50");
    setAiOutput("");
    setCurrentStep(0);
  };

  const addAccount = () => {
    if (accountName.trim()) {
      setAccounts([...accounts, accountName.trim()]);
      setAccountName("");
    }
  };

  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) pan.setValue({ x: 0, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) onClose();
        else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: pan.y }] }]}>
          <View style={styles.modalHandleContainer} {...panResponder.panHandlers}>
            <View style={styles.modalHandle} />
          </View>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>New Campaign</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
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
          </ScrollView>

          <View style={styles.modalFooter}>
            {isGenerating || aiOutput ? (
              <View style={styles.chatInterface}>
                <ProgressBar step={currentStep} />
                <AgentStatus
                  step={currentStep}
                  status={currentStep < 5 ? (isGenerating && !aiOutput ? "Initializing..." : "Agent is working...") : "Strategy Finalized"}
                />

                <ScrollView
                  style={styles.chatScroll}
                  contentContainerStyle={styles.chatScrollContent}
                  ref={(ref) => ref?.scrollToEnd({ animated: true })}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.aiBubble}>
                    <View style={styles.aiBubbleHeader}>
                      <Sparkles size={14} color="#FF6B35" />
                      <Text style={styles.aiBubbleTitle}>GROWWIT AGENT</Text>
                    </View>
                    {!aiOutput && isGenerating ? (
                      <ThinkingDots />
                    ) : (
                      <Text style={styles.aiBubbleText}>{aiOutput || "Initializing tools..."}</Text>
                    )}
                  </View>
                </ScrollView>

                {currentStep >= 5 && (
                  <TouchableOpacity
                    style={[styles.chatCloseButton, { backgroundColor: '#10B981' }]}
                    onPress={() => {
                      if (generatedCampaign) {
                        onSave(generatedCampaign, aiOutput);
                      }
                      onClose();
                      resetForm();
                    }}
                  >
                    <Text style={styles.chatCloseButtonText}>Confirm & Create Campaign</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <TouchableOpacity style={[styles.modalSubmitButton, !isFormValid && styles.modalSubmitButtonDisabled]} onPress={handleSubmit} disabled={!isFormValid}>
                  <Text style={styles.modalSubmitButtonText}>Generate Campaign</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostButton} onPress={triggerTestRun}>
                  <Text style={styles.ghostButtonText}>Auto-fill Zest AI (Test)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ActionCard({
  action,
  campaign,
  onComplete,
}: {
  action: any;
  campaign: any;
  onComplete: (id: string) => void;
}) {
  const handleCopy = async (text: string, type: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", `${type} copied to clipboard!`);
  };

  const handleOpenReddit = () => {
    const url = `https://www.reddit.com/r/${action.subreddit}/submit`;
    Linking.openURL(url).catch((err) =>
      Alert.alert("Error", "Could not open Reddit submission page")
    );
  };

  const handleComplete = () => {
    onComplete(action.id);
  };

  return (
    <View style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <View style={styles.actionIconContainer}>
          {action.type === "post" ? (
            <AlertCircle size={20} color="#FF6B35" />
          ) : (
            <Clock size={20} color="#10B981" />
          )}
        </View>
        <View style={styles.actionInfo}>
          <Text style={styles.actionType}>
            {action.type === "post" ? "Post" : "Comment"} in r/{action.subreddit}
          </Text>
          <View style={styles.statusRow}>
            <Text style={styles.actionCampaign}>{campaign?.name || "Unknown Campaign"}</Text>
            <View style={styles.safetyBadge}>
              <ShieldCheck size={12} color="#10B981" />
              <Text style={styles.safetyText}>Safe to post</Text>
            </View>
          </View>
        </View>
        {action.scheduledFor && (
          <Text style={styles.actionTime}>
            {format(parseISO(action.scheduledFor), "h:mm a")}
          </Text>
        )}
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.contentSections}>
        {action.title && (
          <View style={styles.contentSection}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>REDDIT TITLE</Text>
              <TouchableOpacity onPress={() => handleCopy(action.title, "Title")}>
                <Copy size={14} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            <View style={styles.snippetContainer}>
              <Text style={styles.snippetText}>{action.title}</Text>
            </View>
          </View>
        )}

        {action.content && (
          <View style={styles.contentSection}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>POST BODY</Text>
              <TouchableOpacity onPress={() => handleCopy(action.content, "Body")}>
                <Copy size={14} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            <View style={styles.snippetContainer}>
              <Text style={styles.snippetText}>{action.content}</Text>
              {action.cta && (
                <Text style={styles.ctaText}>{action.cta}</Text>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.openRedditButton}
          onPress={handleOpenReddit}
          activeOpacity={0.7}
        >
          <ExternalLink size={16} color="#FF6B35" />
          <Text style={styles.openRedditText}>Open r/{action.subreddit}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
          activeOpacity={0.7}
        >
          <CheckCircle2 size={16} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>I Posted</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  addButton: {
    position: "absolute",
    top: 16,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  topSectionHeader: {
    height: 44,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B35",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B35",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  createButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF1ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionType: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 8,
  },
  actionCampaign: {
    fontSize: 13,
    color: "#64748B",
  },
  safetyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  safetyText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#10B981",
    textTransform: "uppercase",
  },
  actionTime: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  contentSections: {
    gap: 16,
    marginBottom: 16,
  },
  contentSection: {
    gap: 8,
  },
  sectionLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  snippetContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  snippetText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },
  ctaText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  openRedditButton: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  openRedditText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  completeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#10B981",
    gap: 8,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
    backgroundColor: "#F0FDF4",
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
  campaignCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  campaignIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  campaignProduct: {
    fontSize: 12,
    color: "#64748B",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "90%",
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  modalHandleContainer: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#E2E8F0",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  modalCancel: {
    fontSize: 16,
    color: "#64748B",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
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
  accountChipRemove: {
    fontSize: 20,
    color: "#64748B",
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  modalSubmitButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalSubmitButtonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  testButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  chatInterface: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 20,
    height: 520,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  thinkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  agentAvatarContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: '#FF6B35',
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    elevation: 4,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  thinkingInfo: {
    flex: 1,
  },
  thinkingStatus: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  activeStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeStepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    paddingBottom: 20,
  },
  aiBubble: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 24,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  aiBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiBubbleTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  aiBubbleText: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  chatCloseButton: {
    marginTop: 20,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  chatCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
  },
  ghostButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostButtonText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginBottom: 20,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
});
