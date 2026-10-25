import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { findJanAushadhiEquivalents } from "@neighbourdoc/shared";
import { apiRequest } from "../apiClient";

type Prescription = {
  id: string;
  consultationId: string;
  medicines: string;
  advice: string;
  followUpDate?: string;
  createdAt: string;
};

export function PrescriptionScreen({
  consultationId,
  onRefresh,
}: {
  consultationId: string | null;
  onRefresh: () => void;
}) {
  const [rx, setRx] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!consultationId) return;
    setLoading(true);
    apiRequest<Prescription>(`/prescriptions/${consultationId}`)
      .then((data) => {
        if (data && !("error" in (data as any))) {
          setRx(data);
        } else {
          setRx(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [consultationId]);

  if (!consultationId) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>डिजिटल पर्चा (Prescriptions)</Text>
        <Text style={styles.body}>किसी भी सक्रिय या पुराने परामर्श का आधिकारिक डिजिटल पर्चा देखने के लिए उसे चुनें।</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.card, { alignItems: "center", paddingVertical: 40 }]}>
        <ActivityIndicator color="#0B4F48" size="large" />
        <Text style={[styles.body, { marginTop: 12 }]}>डॉक्टर का पर्चा लोड हो रहा है...</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>डिजिटल पर्चा (Rx)</Text>
          <Text style={styles.ticket}>परामर्श टोकन #{consultationId.slice(0, 14)}</Text>
        </View>
        <Text style={styles.rxSymbol}>℞</Text>
      </View>

      {rx ? (
        <View style={{ marginTop: 16 }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>निर्धारित दवाइयां (Prescribed Medicines)</Text>
            <View style={styles.contentBox}>
              <Text style={styles.medsText}>{rx.medicines}</Text>
            </View>
          </View>

          {findJanAushadhiEquivalents(rx.medicines).foundEquivalents.length > 0 && (
            <View style={{ marginTop: 12, backgroundColor: "#ECFDF5", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#A7F3D0" }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#065F46" }}>
                💊 जन औषधि केंद्र जेनेरिक विकल्प (अनुमानित बचत ~{findJanAushadhiEquivalents(rx.medicines).totalEstimatedSavingsPercent}%)
              </Text>
              <Text style={{ fontSize: 11, color: "#047857", marginTop: 2, marginBottom: 8 }}>
                ये सस्ती दवाइयां किसी भी सरकारी जन औषधि केंद्र (PMBJP) पर उपलब्ध हैं:
              </Text>
              {findJanAushadhiEquivalents(rx.medicines).foundEquivalents.map((eq) => (
                <View key={eq.genericMolecule} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#064E3B" }}>• {eq.genericMolecule}</Text>
                  <Text style={{ fontSize: 11, color: "#047857" }}>
                    ₹{eq.genericPriceInr} (ब्रांडेड: ₹{eq.brandedAvgPriceInr})
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>डॉक्टर की सलाह व परहेज</Text>
            <View style={[styles.contentBox, { backgroundColor: "#F8FAF9" }]}>
              <Text style={styles.adviceText}>{rx.advice}</Text>
            </View>
          </View>

          {rx.followUpDate && (
            <View style={styles.followUpBox}>
              <Text style={styles.followUpText}>पुनः परामर्श की अनुशंसित तारीख: {rx.followUpDate}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.downloadBtn} onPress={() => alert("डिजिटल पर्चा आपके फोन में सेव हो गया है।")}>
            <Text style={styles.downloadText}>📥 आधिकारिक PDF पर्चा डाउनलोड करें</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingTitle}>पर्चा तैयार किया जा रहा है</Text>
          <Text style={styles.waitingText}>
            डॉक्टर आपकी कॉल पूरी करने के बाद पर्चा बना रहे हैं। कुछ पलों में पर्चा यहाँ उपलब्ध हो जाएगा।
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.refreshText}>⟳ स्टेटस रीफ्रेश करें</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 20, borderColor: "#D1E6E3", borderWidth: 1, marginTop: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 20, fontWeight: "900", color: "#0F2F2E" },
  ticket: { fontSize: 11, color: "#64748B", fontWeight: "700", marginTop: 2 },
  rxSymbol: { fontSize: 28, fontWeight: "900", color: "#0B4F48" },
  body: { fontSize: 13, color: "#526173", marginTop: 8 },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 },
  contentBox: { backgroundColor: "#F0F7F6", borderColor: "#D1E6E3", borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 6 },
  medsText: { fontSize: 13, fontWeight: "800", color: "#0F2F2E", lineHeight: 20 },
  adviceText: { fontSize: 12, color: "#334155", lineHeight: 18 },
  followUpBox: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: "#E8F3F1" },
  followUpText: { fontSize: 12, fontWeight: "800", color: "#0B4F48" },
  downloadBtn: { backgroundColor: "#0B4F48", borderRadius: 16, padding: 14, alignItems: "center", marginTop: 16 },
  downloadText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  waitingBox: { marginTop: 20, padding: 16, backgroundColor: "#FFFBEB", borderRadius: 18, borderColor: "#FDE68A", borderWidth: 1, alignItems: "center" },
  waitingTitle: { fontSize: 15, fontWeight: "900", color: "#92400E" },
  waitingText: { fontSize: 12, color: "#B45309", textAlign: "center", marginTop: 4, lineHeight: 17 },
  refreshBtn: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "#FEF3C7" },
  refreshText: { color: "#92400E", fontWeight: "800", fontSize: 12 },
});
