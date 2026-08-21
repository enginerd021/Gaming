import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import GlobalChatWidget from "@/components/GlobalChatWidget";
import Footer from "@/components/Footer";
import SmoothScrollProvider from "@/providers/SmoothScrollProvider";
import InteractiveEmberBackground from "@/components/ui/InteractiveEmberBackground";

export const metadata: Metadata = {
  title: "SHAKTRIX | Esports & Gaming Community Hub",
  description: "Find teammates, register for tournaments, track stats, and build your gaming legacy on SHAKTRIX.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SmoothScrollProvider>
            <InteractiveEmberBackground />
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 2 }}>
              <Navbar />
              <main style={{ flex: '1 0 auto' }}>
                {children}
              </main>
              <GlobalChatWidget />
              <Footer />
            </div>
          </SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
