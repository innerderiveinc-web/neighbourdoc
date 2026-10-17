import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Language } from "@neighbordoc/shared";

export function ProfileScreen({
  phone,
  language,
  onLogout,
}: {
  phone: string;
  language: Language;
  onLogout: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>मरीज़ प्रोफ़ाइल (Profile)</Text>
      <Text style={styles.sub}>अपनी स्वास्थ्य प्राथमिकताएं और संपर्क जानकारी देखें</Text>

      <View style={styles.section}>
        <Text style={styles.label}>रजिस्टर्ड मोबाइल नंबर</Text>
        <Text style={styles.value}>{phone || "+91 (सत्यापित नहीं)"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>परामर्श की भाषा</Text>
        <Text style={styles.value}>{language}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>राष्ट्रीय आपातकालीन नंबर</Text>
        <Text style={[styles.value, { color: "#BE123C" }]}>112 (National Emergency Helpline)</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>स्वास्थ्य सेवा प्लान</Text>
        <Text style={styles.value}>प्रति कॉल प्राथमिक परामर्श (₹49/कॉल)</Text>
      </View>

      <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>साइन आउट करें (Sign Out)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 20, borderColor: "#D1E6E3", borderWidth: 1, marginTop: 16 },
  title: { fontSize: 20, fontWeight: "900", color: "#0F2F2E" },
  sub: { fontSize: 12, color: "#64748B", marginTop: 4, marginBottom: 8 },
  section: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  label: { fontSize: 10, fontWeight: "800", color: "#64748B", textTransform: "uppercase" },
  value: { fontSize: 14, fontWeight: "800", color: "#0F2F2E", marginTop: 2 },
  logoutBtn: { backgroundColor: "#FFF1F2", padding: 13, borderRadius: 16, alignItems: "center", marginTop: 22, borderWidth: 1, borderColor: "#FECDD3" },
  logoutText: { color: "#BE123C", fontWeight: "900", fontSize: 13 },
});
