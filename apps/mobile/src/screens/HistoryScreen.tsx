import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiRequest } from "../apiClient";

type Consultation = {
  id: string;
  symptoms: string;
  status: string;
  paymentStatus: string;
  amount: number;
  createdAt: string;
};

export function HistoryScreen({
  onSelectConsultation,
}: {
  onSelectConsultation: (id: string) => void;
}) {
  const [list, setList] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest<Consultation[]>("/consultations")
      .then((data) => {
        if (Array.isArray(data)) setList(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>परामर्श इतिहास (Consultation History)</Text>
      <Text style={styles.sub}>पुराने परामर्श और जारी किए गए पर्चे यहाँ देखें</Text>

      <View style={styles.list}>
        {list.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelectConsultation(item.id)}
            style={styles.item}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.symptoms}>{item.symptoms}</Text>
              <Text style={styles.meta}>
                {new Date(item.createdAt).toLocaleDateString("en-IN")} · शुल्क: ₹{item.amount / 100}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.status === "completed" ? "सफल" : item.status.replace("_", " ")}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {list.length === 0 && !loading && (
          <Text style={styles.empty}>अभी कोई पुराना परामर्श दर्ज नहीं है।</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 20, borderColor: "#D1E6E3", borderWidth: 1, marginTop: 16 },
  title: { fontSize: 20, fontWeight: "900", color: "#0F2F2E" },
  sub: { fontSize: 12, color: "#64748B", marginTop: 4 },
  list: { marginTop: 16, gap: 10 },
  item: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 18, backgroundColor: "#F8FAF9", borderWidth: 1, borderColor: "#E2E8F0" },
  symptoms: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
  meta: { fontSize: 11, color: "#64748B", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: "#E8F3F1" },
  badgeText: { fontSize: 11, fontWeight: "900", color: "#0B4F48", textTransform: "capitalize" },
  empty: { textAlign: "center", color: "#94A3B8", paddingVertical: 24, fontSize: 13 },
});
