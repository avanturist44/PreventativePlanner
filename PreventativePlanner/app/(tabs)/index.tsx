import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useCallback, useEffect } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Colors from "@/constants/colors";
import { supabase } from "@/supabaseClient";
import { generateRecommendations } from "@/app/services/recommendationEngine";

type Status = "upcoming" | "completed";

interface Recommendation {
  id: string;
  title: string;
  due_date: string;
  status: Status;
  category: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isDueSoon(dateStr: string): boolean {
  const due = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

function isOverdue(dateStr: string): boolean {
  const due = new Date(dateStr + "T00:00:00");
  return due < new Date();
}

function TaskCard({
  task,
  onComplete,
  onUndo,
}: {
  task: Recommendation;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleComplete = useCallback(() => {
    scale.value = withSpring(0.96, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 200 });
    });

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onComplete(task.id);
  }, [task.id, onComplete, scale]);

  const dueSoon = isDueSoon(task.due_date);
  const overdue = isOverdue(task.due_date);
  const isCompleted = task.status === "completed";

  const accentColor = isCompleted
    ? Colors.light.success
    : overdue
    ? "#DC2626"
    : dueSoon
    ? "#D97706"
    : Colors.light.primary;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      layout={Layout.springify()}
    >
      <Animated.View style={animatedStyle}>
        <View
          style={[
            styles.card,
            isCompleted && styles.cardCompleted,
            { borderLeftColor: accentColor },
          ]}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardMeta}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: accentColor + "15" },
                ]}
              >
                <Text style={[styles.categoryText, { color: accentColor }]}>
                  {task.category}
                </Text>
              </View>

              {!isCompleted && (overdue || dueSoon) && (
                <View
                  style={[
                    styles.urgencyBadge,
                    { backgroundColor: accentColor + "15" },
                  ]}
                >
                  <Ionicons
                    name={overdue ? "alert-circle" : "time-outline"}
                    size={11}
                    color={accentColor}
                  />
                  <Text style={[styles.urgencyText, { color: accentColor }]}>
                    {overdue ? "Overdue" : "Due soon"}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={[styles.taskTitle, isCompleted && styles.taskTitleDone]}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={Colors.light.textTertiary}
                />
                <Text style={styles.dateText}>{formatDate(task.due_date)}</Text>
              </View>

              {isCompleted ? (
                <Pressable
                  onPress={() => onUndo(task.id)}
                  style={({ pressed }) => [
                    styles.completeBtn,
                    pressed && styles.completeBtnPressed,
                  ]}
                >
                  <Ionicons
                    name="arrow-undo"
                    size={14}
                    color={Colors.light.success}
                  />
                  <Text style={styles.completeBtnText}>Undo</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleComplete}
                  style={({ pressed }) => [
                    styles.completeBtn,
                    pressed && styles.completeBtnPressed,
                  ]}
                  accessibilityLabel={`Mark ${task.title} as complete`}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={Colors.light.primary}
                  />
                  <Text style={styles.completeBtnText}>Mark done</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
}

export default function PlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<Recommendation[]>([]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/AuthPage");
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const stored = await AsyncStorage.getItem("health_profile");

      if (!stored) {
        setTasks([]);
        return;
      }

      const profile = JSON.parse(stored);
      const generated = generateRecommendations(profile);

      const formatted: Recommendation[] = generated.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        due_date: item.dueDate,
        status: item.status,
      }));

      setTasks(formatted);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    }
  };

  const markComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "completed" } : t))
    );
  }, []);

  const markIncomplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "upcoming" } : t))
    );
  }, []);

  const upcoming = tasks.filter((t) => t.status === "upcoming");
  const completed = tasks.filter((t) => t.status === "completed");
  const progress = tasks.length > 0 ? completed.length / tasks.length : 0;

  type ListItem =
    | { type: "header-card" }
    | { type: "section-upcoming" }
    | { type: "task"; task: Recommendation }
    | { type: "section-completed" }
    | { type: "spacer" };

  const listData: ListItem[] = [
    { type: "header-card" },
    ...(upcoming.length > 0
      ? [
          { type: "section-upcoming" as const },
          ...upcoming.map((t) => ({ type: "task" as const, task: t })),
        ]
      : []),
    ...(completed.length > 0
      ? [
          { type: "section-completed" as const },
          ...completed.map((t) => ({ type: "task" as const, task: t })),
        ]
      : []),
    { type: "spacer" },
  ];

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "header-card") {
      return (
        <View style={[styles.headerCard, { paddingTop: topPad + 16 }]}>
          <View style={styles.topRow}>
            <Text style={styles.appName}>Preventative Care Planner</Text>

            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>

          <Text style={styles.appSubtitle}>
            Track your preventative care recommendations
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{upcoming.length}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: Colors.light.success }]}>
                {completed.length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statNum}>{tasks.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={styles.progressPct}>
                {Math.round(progress * 100)}%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` as any },
                ]}
              />
            </View>
          </View>
        </View>
      );
    }

    if (item.type === "section-upcoming") {
      return (
        <SectionHeader
          title="Upcoming Recommendations"
          count={upcoming.length}
        />
      );
    }

    if (item.type === "section-completed") {
      return (
        <SectionHeader
          title="Completed Recommendations"
          count={completed.length}
        />
      );
    }

    if (item.type === "task") {
      return (
        <TaskCard
          task={item.task}
          onComplete={markComplete}
          onUndo={markIncomplete}
        />
      );
    }

    if (item.type === "spacer") {
      return <View style={{ height: bottomPad + 20 }} />;
    }

    return null;
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) => {
          if (item.type === "task") return item.task.id;
          return `${item.type}-${index}`;
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={listData.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    paddingHorizontal: 16,
  },

  headerCard: {
    backgroundColor: Colors.light.primary,
    marginHorizontal: -16,
    paddingHorizontal: 24,
    paddingBottom: 28,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginBottom: 4,
    flex: 1,
    marginRight: 12,
  },
  appSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 24,
  },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  statNum: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 30,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  progressSection: {
    gap: 8,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
  },
  progressPct: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  countBadge: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },

  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  cardCompleted: {
    opacity: 0.7,
  },
  cardContent: {
    padding: 14,
    gap: 8,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  categoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  urgencyText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    lineHeight: 22,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: Colors.light.textTertiary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textTertiary,
  },

  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  completeBtnPressed: {
    opacity: 0.7,
  },
  completeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
});
