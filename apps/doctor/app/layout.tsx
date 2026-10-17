import "./globals.css";

export const metadata = {
  title: "NeighborDoc — डॉक्टर क्लिनिक कंसोल (RMP Cockpit)",
  description: "टेली-परामर्श कतार, कॉल कॉकपिट और डिजिटल प्रिस्क्रिप्शन पैड।"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
