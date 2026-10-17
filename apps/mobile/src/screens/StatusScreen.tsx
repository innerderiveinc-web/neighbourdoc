import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function StatusScreen({
  consultationId,
  doctorId,
  callbackDeadline,
  onViewPrescription,
  onBookNew,
}: {
  consultationId: string | null;
  doctorId: string | null;
  callbackDeadline: string | null;
  onViewPrescription: () => void;
  onBookNew: () => void;
}) {
  if (!consultationId) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>कोई सक्रिय परामर्श नहीं है</Text>
        <Text style={styles.body}>वर्तमान में आपकी कोई बुकिंग प्रक्रियाधीन नहीं है। जब भी डॉक्टर की सलाह चाहिए, नीचे दिए बटन से शुरू करें।</Text>
        <TouchableOpacity onPress={onBookNew} style={styles.button}>
          <Text style={styles.buttonText}>डॉक्टर परामर्श बुक करें (₹49)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const deadlineFormatted = callbackDeadline
    ? new Date(callbackDeadline).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "15 मिनट के अंदर";

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <Text style={styles.liveBadge}>● डॉक्टर समीक्षा जारी है</Text>
        <Text style={styles.slaBadge}>15-मिनट गारंटी</Text>
      </View>

      <Text style={styles.title}>डॉक्टर जल्द आपको कॉल करेंगे</Text>
      <Text style={styles.ticket}>बुकिंग टोकन ID: #{consultationId.slice(0, 16)}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>अधिकतम कॉलबैक समयसीमा</Text>
        <Text style={styles.deadlineTime}>{deadlineFormatted}</Text>

        <Text style={[styles.label, { marginTop: 12 }]}>असाइंड चिकित्सक</Text>
        <Text style={styles.doctorName}>
          {doctorId ? `डॉ. ${doctorId} (MBBS)` : "डॉ. प्रिया शर्मा (जनरल फिजिशियन)"}
        </Text>
      </View>

      <View style={styles.stepBox}>
        <Text style={styles.step}>1. कृपया अपना फोन चालू रखें और पास रखें ताकि कॉल मिस न हो।</Text>
        <Text style={styles.step}>2. डॉक्टर आपकी तकलीफ़ सुनेंगे और सही दवा व परहेज बताएंगे।</Text>
        <Text style={styles.step}>3. बातचीत के तुरंत बाद आपका मान्य डिजिटल पर्चा WhatsApp पर आ जाएगा।</Text>
      </View>

      <TouchableOpacity onPress={onViewPrescription} style={styles.button}>
        <Text style={styles.buttonText}>डिजिटल पर्चा (Rx) देखें &rarr;</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onBookNew} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>नया परामर्श बुक करें</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 20, borderColor: "#D1E6E3", borderWidth: 1, marginTop: 16 },
  badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  liveBadge: { backgroundColor: "#FEF3C7", color: "#92400E", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: "900" },
  slaBadge: { backgroundColor: "#E8F3F1", color: "#0B4F48", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: "900" },
  title: { fontSize: 22, fontWeight: "900", color: "#0F2F2E", marginTop: 12 },
  ticket: { fontSize: 12, color: "#64748B", fontWeight: "700", marginTop: 2 },
  body: { fontSize: 13, color: "#4A5568", marginTop: 8, lineHeight: 19 },
  infoBox: { backgroundColor: "#F0F7F6", borderColor: "#D1E6E3", borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 16 },
  label: { fontSize: 11, fontWeight: "800", color: "#0B4F48", textTransform: "uppercase" },
  deadlineTime: { fontSize: 26, fontWeight: "900", color: "#0F2F2E", marginTop: 2 },
  doctorName: { fontSize: 14, fontWeight: "800", color: "#107569", marginTop: 2 },
  stepBox: { marginTop: 16, gap: 6 },
  step: { fontSize: 12, color: "#475569", lineHeight: 18 },
  button: { backgroundColor: "#0B4F48", borderRadius: 16, padding: 14, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  secondaryButton: { borderRadius: 16, padding: 12, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: "#CBD5E1" },
  secondaryButtonText: { color: "#475569", fontWeight: "800", fontSize: 13 },
});
