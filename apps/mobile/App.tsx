import { useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Language } from "@neighbourdoc/shared";

import { LanguageScreen } from "./src/screens/LanguageScreen";
import { OtpScreen } from "./src/screens/OtpScreen";
import { BookScreen } from "./src/screens/BookScreen";
import { StatusScreen } from "./src/screens/StatusScreen";
import { PrescriptionScreen } from "./src/screens/PrescriptionScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

const tabs = ["Home", "Book", "Status", "Prescription", "History", "Language", "Profile"] as const;

export default function App() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Home");
  const [language, setLanguage] = useState<Language>("Hindi");
  const [patientPhone, setPatientPhone] = useState("+919711111111");
  const [patientName, setPatientName] = useState("Ramesh Kumar");

  // Active consultation tracking
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [assignedDoctorId, setAssignedDoctorId] = useState<string | null>(null);
  const [callbackDeadline, setCallbackDeadline] = useState<string | null>(null);

  function handleBookingSuccess(id: string, doctorId: string | null, deadline: string | null) {
    setConsultationId(id);
    setAssignedDoctorId(doctorId);
    setCallbackDeadline(deadline);
    setActiveTab("Status");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* App Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>NeighbourDoc</Text>
          <TouchableOpacity onPress={() => setActiveTab("Language")} style={styles.langPill}>
            <Text style={styles.langPillText}>🌐 {language}</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, isActive && styles.activeTab]}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab Content Routing */}
        {activeTab === "Home" && (
          <View>
            <Text style={styles.hero}>घर बैठे डॉक्टर से सलाह लें — 15 मिनट में</Text>
            <Text style={styles.sub}>सिर्फ ₹49 फीस। NMC वेरिफाइड MBBS डॉक्टर से सीधी बातचीत और मान्य डिजिटल पर्चा।</Text>

            <View style={styles.promoCard}>
              <Text style={styles.promoTitle}>🩺 अभी डॉक्टर से बात करनी है?</Text>
              <Text style={styles.promoBody}>
                मौसम का बुखार, खांसी, पेट दर्द या कोई भी तकलीफ़ — 1 मिनट में फॉर्म भरें, डॉक्टर 15 मिनट में सीधे आपको फोन करेंगे।
              </Text>
              <TouchableOpacity onPress={() => setActiveTab("Book")} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>डॉक्टर परामर्श बुक करें (₹49) &rarr;</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.featuresRow}>
              <View style={styles.featureBox}>
                <Text style={styles.featureIcon}>⏱️</Text>
                <Text style={styles.featureTitle}>15 मिनट</Text>
                <Text style={styles.featureSub}>100% रिफंड SLA</Text>
              </View>
              <View style={styles.featureBox}>
                <Text style={styles.featureIcon}>₹49</Text>
                <Text style={styles.featureTitle}>किफ़ायती फीस</Text>
                <Text style={styles.featureSub}>UPI से भुगतान</Text>
              </View>
              <View style={styles.featureBox}>
                <Text style={styles.featureIcon}>📄</Text>
                <Text style={styles.featureTitle}>डिजिटल Rx</Text>
                <Text style={styles.featureSub}>पूरे देश में मान्य</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "Book" && (
          <BookScreen
            initialName={patientName}
            initialPhone={patientPhone}
            language={language}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {activeTab === "Status" && (
          <StatusScreen
            consultationId={consultationId}
            doctorId={assignedDoctorId}
            callbackDeadline={callbackDeadline}
            onViewPrescription={() => setActiveTab("Prescription")}
            onBookNew={() => setActiveTab("Book")}
          />
        )}

        {activeTab === "Prescription" && (
          <PrescriptionScreen
            consultationId={consultationId}
            onRefresh={() => setActiveTab("Prescription")}
          />
        )}

        {activeTab === "History" && (
          <HistoryScreen
            onSelectConsultation={(id) => {
              setConsultationId(id);
              setActiveTab("Prescription");
            }}
          />
        )}

        {activeTab === "Language" && (
          <LanguageScreen
            selectedLanguage={language}
            onSelect={(lang) => {
              setLanguage(lang);
              setActiveTab("Home");
            }}
          />
        )}

        {activeTab === "Profile" && (
          <ProfileScreen
            phone={patientPhone}
            language={language}
            onLogout={() => {
              setConsultationId(null);
              setActiveTab("Home");
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFBF9" },
  container: { padding: 18, paddingBottom: 50 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: "#0B4F48", fontWeight: "900", fontSize: 20 },
  langPill: { backgroundColor: "#E8F3F1", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  langPillText: { fontSize: 12, fontWeight: "800", color: "#0B4F48" },
  hero: { color: "#0F2F2E", fontWeight: "900", fontSize: 28, lineHeight: 36, marginTop: 18 },
  sub: { color: "#4A5568", fontSize: 14, lineHeight: 21, marginTop: 8 },
  tabs: { flexDirection: "row", gap: 8, paddingVertical: 16 },
  tab: { borderColor: "#E2E8F0", borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  activeTab: { backgroundColor: "#0B4F48", borderColor: "#0B4F48" },
  tabText: { fontWeight: "800", color: "#64748B", fontSize: 12 },
  activeTabText: { color: "#FFFFFF" },
  promoCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18, marginTop: 14, borderWidth: 1, borderColor: "#D1E6E3", shadowColor: "#0B4F48", shadowOpacity: 0.05, shadowRadius: 10 },
  promoTitle: { fontSize: 17, fontWeight: "900", color: "#0F2F2E" },
  promoBody: { fontSize: 13, color: "#64748B", marginTop: 6, lineHeight: 18 },
  primaryBtn: { backgroundColor: "#0B4F48", borderRadius: 16, padding: 14, alignItems: "center", marginTop: 14 },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  featuresRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  featureBox: { flex: 1, backgroundColor: "#FFFFFF", padding: 12, borderRadius: 18, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  featureIcon: { fontSize: 20, color: "#0B4F48" },
  featureTitle: { fontSize: 12, fontWeight: "900", color: "#0F2F2E", marginTop: 4 },
  featureSub: { fontSize: 10, color: "#64748B", textAlign: "center", marginTop: 2 },
});
