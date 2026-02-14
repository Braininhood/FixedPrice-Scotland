import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import ErrorBoundaryWrapper from "@/components/error-boundary-wrapper";

/** Allow zoom and work at any resolution/device (accessibility). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FixedPrice Scotland | Modern Real Estate Platform",
  description: "Clever, modern solution for Scottish real estate with fixed-price transparency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <ErrorBoundaryWrapper>
          <AuthProvider>
            <Header />
            <main className="flex-1 min-w-0 w-full">
              {children}
            </main>
            <Footer />
            <Toaster position="top-right" />
          </AuthProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
