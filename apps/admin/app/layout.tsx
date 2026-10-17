import "./globals.css";

export const metadata = {
  title: "NeighborDoc — ऑपरेशंस व SLA एडमिन डैशबोर्ड",
  description: "15-Min SLA मॉनिटरिंग, टेलीमेट्री और कम्प्लायंस ऑडिट कंसोल।"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
