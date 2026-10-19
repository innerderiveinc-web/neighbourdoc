import "./globals.css";

export const metadata = {
  title: "NeighbourDoc — आपका अपना डिजिटल फैमिली डॉक्टर | ₹49 में MBBS परामर्श",
  description: "15 मिनट में NMC वेरिफाइड MBBS डॉक्टर से सीधा फोन कॉल परामर्श व कानूनी डिजिटल पर्चा (Rx)। बुखार, खांसी, पेट दर्द के लिए सुरक्षित प्राथमिक स्वास्थ्य सेवा।",
  keywords: ["NeighbourDoc", "Telemedicine India", "Online Doctor ₹49", "MBBS Doctor Consultation", "Digital Prescription", "Jan Aushadhi"],
  openGraph: {
    title: "NeighbourDoc — 15 मिनट में डॉक्टर कॉलबैक (₹49)",
    description: "घर बैठे NMC वेरिफाइड MBBS डॉक्टर से सही सलाह और कानूनी डिजिटल पर्चा पाएं।",
    type: "website",
    locale: "hi_IN"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
