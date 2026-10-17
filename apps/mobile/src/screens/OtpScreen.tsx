import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { apiRequest } from "../apiClient";

export function OtpScreen({
  phone,
  onVerified,
}: {
  phone: string;
  onVerified: (userPhone: string) => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState(phone || "+91");
  const [otpCode, setOtpCode] = useState("123456");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest<{ ok: boolean; error?: string }>("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone: phoneNumber, role: "patient" }),
      });
      if (res.ok) {
        setOtpSent(true);
      } else {
        setError(res.error ?? "OTP भेजने में त्रुटि।");
      }
    } catch {
      setError("सर्वर से संपर्क नहीं हो पाया।");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest<{ ok: boolean; sessionToken?: string; error?: string }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone: phoneNumber, code: otpCode }),
      });
      if (res.ok) {
        onVerified(phoneNumber);
      } else {
        setError(res.error ?? "अमान्य OTP कोड।");
      }
    } catch {
      setError("सत्यापन असफल रहा।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>मोबाइल नंबर सत्यापन (Login)</Text>
      <Text style={styles.sub}>WhatsApp या SMS से 1-क्लिक सुरक्षित लॉगिन</Text>

      <View style={styles.form}>
        <Text style={styles.label}>मोबाइल नंबर (+91 सहित)</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholder="+919876543210"
        />

        {otpSent && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>6-अंकों का OTP कोड</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Text style={styles.helperText}>डेमो टेस्ट कोड: 123456</Text>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          disabled={loading}
          onPress={!otpSent ? handleSendOtp : handleVerifyOtp}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {loading ? "कृपया प्रतीक्षा करें..." : !otpSent ? "OTP कोड प्राप्त करें" : "सत्यापित करें व आगे बढ़ें"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 20, borderColor: "#D1E6E3", borderWidth: 1, marginTop: 16 },
  title: { fontSize: 20, fontWeight: "900", color: "#0F2F2E" },
  sub: { fontSize: 12, color: "#64748B", marginTop: 4 },
  form: { marginTop: 16 },
  label: { fontSize: 12, fontWeight: "800", color: "#334155" },
  input: { borderColor: "#CBD5E1", borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 6, fontSize: 15, backgroundColor: "#F8FAFC", color: "#0F172A" },
  otpInput: { textAlign: "center", letterSpacing: 8, fontSize: 20, fontWeight: "900", color: "#0B4F48" },
  helperText: { fontSize: 11, color: "#107569", fontWeight: "700", marginTop: 4 },
  errorText: { color: "#DC2626", fontSize: 12, fontWeight: "700", marginTop: 8 },
  button: { backgroundColor: "#0B4F48", borderRadius: 16, padding: 14, alignItems: "center", marginTop: 16 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },
});
