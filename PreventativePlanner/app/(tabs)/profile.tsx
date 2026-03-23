import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const STORAGE_KEY = "health_profile";

const SEX_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"] as const;
const RISK_FACTOR_OPTIONS = [
  "Smoking",
  "Diabetes",
  "High Blood Pressure",
  "Heart Disease",
  "Obesity",
  "Family History",
] as const;

type SexOption = (typeof SEX_OPTIONS)[number];

type HealthProfile = {
  age: number;
  sex: SexOption;
  riskFactors: string[];
};

export default function ProfileScreen() {
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<SexOption | "">("");
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed: HealthProfile = JSON.parse(stored);
        setAge(String(parsed.age));
        setSex(parsed.sex);
        setRiskFactors(Array.isArray(parsed.riskFactors) ? parsed.riskFactors : []);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      Alert.alert("Error", "Could not load saved profile.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRiskFactor = (factor: string) => {
    setRiskFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((item) => item !== factor)
        : [...prev, factor]
    );
  };

  const validateProfile = () => {
    const trimmedAge = age.trim();

    if (!trimmedAge && !sex && riskFactors.length === 0) {
      Alert.alert("Validation Error", "Cannot submit an empty profile.");
      return false;
    }

    if (!trimmedAge) {
      Alert.alert("Validation Error", "Age is required.");
      return false;
    }

    const parsedAge = Number(trimmedAge);

    if (Number.isNaN(parsedAge)) {
      Alert.alert("Validation Error", "Age must be a valid number.");
      return false;
    }

    if (parsedAge < 0) {
      Alert.alert("Validation Error", "Age cannot be negative.");
      return false;
    }

    if (parsedAge > 120) {
      Alert.alert("Validation Error", "Age must be between 0 and 120.");
      return false;
    }

    if (!sex) {
      Alert.alert("Validation Error", "Please select a sex.");
      return false;
    }

    if (!Array.isArray(riskFactors)) {
      Alert.alert("Validation Error", "Risk factors must be stored as an array.");
      return false;
    }

    return true;
  };

  const saveProfile = async () => {
    if (!validateProfile()) return;

    const profile: HealthProfile = {
      age: Number(age),
      sex: sex as SexOption,
      riskFactors,
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      Alert.alert("Success", "Profile saved successfully.");
      router.replace("/(tabs)")
    } catch (error) {
      console.error("Failed to save profile:", error);
      Alert.alert("Error", "Could not save profile.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Health Profile</Text>

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter age"
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />

      <Text style={styles.label}>Sex</Text>
      <View style={styles.optionsContainer}>
        {SEX_OPTIONS.map((option) => {
          const selected = sex === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, selected && styles.selectedButton]}
              onPress={() => setSex(option)}
            >
              <Text style={[styles.optionText, selected && styles.selectedText]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Risk Factors</Text>
      {RISK_FACTOR_OPTIONS.map((factor) => {
        const selected = riskFactors.includes(factor);
        return (
          <TouchableOpacity
            key={factor}
            style={[styles.checkboxRow, selected && styles.selectedCheckbox]}
            onPress={() => toggleRiskFactor(factor)}
          >
            <Text style={styles.checkboxIcon}>{selected ? "☑" : "☐"}</Text>
            <Text style={styles.checkboxLabel}>{factor}</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  selectedButton: {
    borderColor: "#222",
    backgroundColor: "#222",
  },
  optionText: {
    color: "#222",
  },
  selectedText: {
    color: "#fff",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 8,
  },
  selectedCheckbox: {
    backgroundColor: "#f2f2f2",
  },
  checkboxIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});