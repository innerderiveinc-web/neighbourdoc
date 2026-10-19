import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Language } from "@neighbourdoc/shared";

const languages: { code: Language; label: string; sub: string }[] = [
  { code: "Hindi", label: "हिंदी", sub: "Hindi" },
  { code: "English", label: "English", sub: "English" },
  { code: "Hinglish", label: "Hinglish", sub: "मिक्स हिंदी-English" },
  { code: "Marathi", label: "मराठी", sub: "Marathi" },
  { code: "Bengali", label: "বাংলা", sub: "Bengali" },
  { code: "Tamil", label: "தமிழ்", sub: "Tamil" },
];

export function LanguageScreen({
  selectedLanguage,
  onSelect,
}: {
  selectedLanguage: Language;
  onSelect: (lang: Language) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>पसंदीदा भाषा चुनें (Select Language)</Text>
      <Text style={styles.subheading}>डॉक्टर आपसे इसी भाषा में बातचीत करेंगे</Text>

      <View style={styles.grid}>
        {languages.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              onPress={() => onSelect(lang.code)}
              style={[styles.langCard, isSelected && styles.selectedCard]}
            >
              <Text style={[styles.langLabel, isSelected && styles.selectedText]}>{lang.label}</Text>
              <Text style={[styles.langSub, isSelected && styles.selectedSub]}>{lang.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 20, borderColor: "#D1E6E3", borderWidth: 1, marginTop: 16 },
  heading: { fontSize: 18, fontWeight: "900", color: "#0F2F2E" },
  subheading: { fontSize: 12, color: "#64748B", marginTop: 4, marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  langCard: {
    width: "48%",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#F8FAF9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  selectedCard: { borderColor: "#0B4F48", backgroundColor: "#F0F7F6" },
  langLabel: { fontSize: 16, fontWeight: "900", color: "#1E293B" },
  langSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  selectedText: { color: "#0B4F48" },
  selectedSub: { color: "#107569" },
});
