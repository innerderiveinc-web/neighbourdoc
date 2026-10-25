import React, { useMemo, useState } from "react";
import { Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { screenEmergencySymptoms, getConsultationPrice, type ConsultationPlan, type Language } from "@neighbourdoc/shared";

export function BookScreen({
  initialName,
  initialPhone,
  language,
  onBookingSuccess,
}: {
  initialName: string;
  initialPhone: string;
  language: Language;
  onBookingSuccess: (consultationId: string, doctorId: string | null, callbackDeadline: string | null) => void;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [age, setAge] = useState("28");
  const [city, setCity] = useState("Lucknow");
  const [symptoms, setSymptoms] = useState("");
  const [plan, setPlan] = useState<ConsultationPlan>("basic");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emergency = useMemo(
    () => (symptoms.trim() ? screenEmergencySymptoms(symptoms) : { blocked: false, matchedTerms: [], message: "" }),
    [symptoms]
  );
  const currentPrice = getConsultationPrice(plan);

  const quickChips = [
    { label: "+ बुखार", text: "2 दिन से तेज़ बुखार है" },
    { label: "+ खांसी-जुकाम", text: "सूखी खांसी व गले में दर्द" },
    { label: "+ पेट दर्द", text: "पेट में मरोड़ व दस्त" },
    { label: "+ सिरदर्द", text: "सिरदर्द व चक्कर आ रहे हैं" }
  ];

  async function handleBook() {
    if (!name.trim() || !phone.trim() || !symptoms.trim()) {
      setError("Please fill in your name, phone, and symptoms.");
      return;
    }
    if (!consent) {
      setError("Teleconsultation consent is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { apiRequest } = await import("../apiClient");
      const booking = await apiRequest<{
        ok: boolean;
        consultation?: { id: string };
        emergency?: { message: string };
        error?: string;
      }>("/consultations", {
        method: "POST",
        body: JSON.stringify({
          name,
          phone,
          age: Number(age) || 30,
          gender: "other",
          city,
          language,
          symptoms,
          plan,
          consent: true,
          referralSource: "mobile_native",
        }),
      });

      if (!booking.ok || !booking.consultation) {
        setError(booking.emergency?.message ?? booking.error ?? "Consultation blocked.");
        setLoading(false);
        return;
      }

      const order = await apiRequest<{ orderId: string }>("/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ plan, consultationId: booking.consultation.id }),
      });

      const paid = await apiRequest<{
        ok: boolean;
        consultation: { id: string; doctorId: string | null; callbackDeadline: string | null };
        error?: string;
      }>("/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          consultationId: booking.consultation.id,
          orderId: order.orderId,
          gatewayPaymentId: `pay_m_${Date.now()}`,
        }),
      });

      if (paid.ok) {
        onBookingSuccess(paid.consultation.id, paid.consultation.doctorId, paid.consultation.callbackDeadline);
      } else {
        setError(paid.error ?? "Payment could not be confirmed.");
      }
    } catch {
      setError("Could not reach API server on port 3100.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Book Doctor Consultation</Text>
      <Text style={styles.sub}>15-minute doctor callback (100% refund SLA)</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Patient Name</Text>
        <TextInput style={styles.input} placeholder="Ramesh Kumar" value={name} onChangeText={setName} />

        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="+919876543210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.input} placeholder="28" keyboardType="number-pad" value={age} onChangeText={setAge} />
          </View>
        </View>

        <Text style={styles.label}>City / Location</Text>
        <TextInput style={styles.input} placeholder="Lucknow" value={city} onChangeText={setCity} />

        <Text style={styles.label}>Symptoms / Problem Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe fever, cough, stomach pain, skin rash..."
          multiline
          value={symptoms}
          onChangeText={setSymptoms}
        />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6, marginBottom: 8 }}>
          {quickChips.map((c) => (
            <TouchableOpacity
              key={c.label}
              onPress={() => setSymptoms((prev) => (prev ? `${prev}, ${c.text}` : c.text))}
              style={{ backgroundColor: "#F1F5F9", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#CBD5E1" }}
            >
              <Text style={{ fontSize: 11, color: "#334155", fontWeight: "600" }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {emergency.blocked && (
          <View style={styles.emergencyBox}>
            <Text style={styles.emergencyTitle}>🚨 आपातकालीन चेतावनी (Emergency Warning)</Text>
            <Text style={styles.emergencyText}>{emergency.message}</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => Linking.openURL("tel:112")}
                style={{ backgroundColor: "#DC2626", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 12 }}>📞 112 डायल करें</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL("tel:108")}
                style={{ backgroundColor: "#991B1B", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 12 }}>🚑 108 डायल करें</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={[styles.label, { marginTop: 12 }]}>Choose Plan</Text>
        <View style={styles.planRow}>
          {(["basic", "priority"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPlan(p)}
              style={[styles.planCard, plan === p && styles.selectedPlanCard]}
            >
              <Text style={[styles.planName, plan === p && styles.selectedPlanText]}>
                {p === "basic" ? "Basic Triage" : "Priority Call"}
              </Text>
              <Text style={[styles.planPrice, plan === p && styles.selectedPlanPrice]}>
                ₹{getConsultationPrice(p).amount / 100}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => setConsent(!consent)} style={styles.consentRow}>
          <Text style={styles.checkbox}>{consent ? "☑" : "☐"}</Text>
          <Text style={styles.consentText}>I consent to teleconsultation under Indian Medical Guidelines</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          disabled={loading || emergency.blocked}
          onPress={handleBook}
          style={[styles.button, (loading || emergency.blocked) && styles.disabled]}
        >
          <Text style={styles.buttonText}>
            {loading ? "Confirming..." : `Pay ₹${currentPrice.amount / 100} & Start 15-Min SLA`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 20, borderColor: "#D7E3EF", borderWidth: 1, marginTop: 16 },
  title: { fontSize: 22, fontWeight: "900", color: "#073B4C" },
  sub: { fontSize: 13, color: "#0E9F6E", fontWeight: "700", marginTop: 2 },
  form: { marginTop: 16 },
  label: { fontSize: 12, fontWeight: "800", color: "#334155", marginTop: 8 },
  input: { borderColor: "#D7E3EF", borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 4, fontSize: 15, backgroundColor: "#F8FAFC" },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  row: { flexDirection: "row", marginTop: 4 },
  emergencyBox: { backgroundColor: "#FEF2F2", borderColor: "#F87171", borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 12 },
  emergencyTitle: { color: "#991B1B", fontWeight: "900", fontSize: 14 },
  emergencyText: { color: "#B91C1C", fontSize: 12, marginTop: 4, lineHeight: 16 },
  planRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  planCard: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center" },
  selectedPlanCard: { borderColor: "#0E9F6E", backgroundColor: "#F0FDF4" },
  planName: { fontSize: 12, fontWeight: "800", color: "#64748B" },
  selectedPlanText: { color: "#047857" },
  planPrice: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginTop: 4 },
  selectedPlanPrice: { color: "#065F46" },
  consentRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  checkbox: { fontSize: 18, marginRight: 8, color: "#0E9F6E" },
  consentText: { fontSize: 11, color: "#64748B", flex: 1, fontWeight: "600" },
  errorText: { color: "#DC2626", fontSize: 12, fontWeight: "700", marginTop: 10 },
  button: { backgroundColor: "#0E9F6E", borderRadius: 18, padding: 16, alignItems: "center", marginTop: 16 },
  disabled: { opacity: 0.45 },
  buttonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
});
