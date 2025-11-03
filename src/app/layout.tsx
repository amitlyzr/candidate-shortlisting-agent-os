import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TourWrapper } from "@/components/providers/TourWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Candidate Shortlisting App - Lyzr AI",
  description: "Candidate Shortlisting powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <TourWrapper>
            <body
              className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
              {children}
            </body>
          </TourWrapper>
        </AuthProvider>
      </ThemeProvider>
    </html>
  );
}
