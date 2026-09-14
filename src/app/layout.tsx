import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Occasion Spaces — Temporary Digital Spaces for Shared Occasions",
  description: "The occasion is the primary identity. Temporary digital spaces for cultural festivals, weddings, and community moments without permanent social network bloat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-stone-50/50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 selection:bg-amber-100 selection:text-amber-900 font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="border-t border-stone-200/80 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 py-8 mt-12 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
                <span className="font-semibold text-stone-700 dark:text-stone-300">Occasion Spaces</span>
                <span>Occasion over Person • Temporary by Design • Dignified & Respectful</span>
              </div>
              <div className="flex items-center gap-4 text-stone-400">
                <span>No follower graphs</span>
                <span>•</span>
                <span>No viral algorithmic feeds</span>
                <span>•</span>
                <span>Privacy-first preservation</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
