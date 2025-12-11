import type { Metadata } from "next";
import { Geist, Geist_Mono, Be_Vietnam_Pro } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ConditionalAppContent from "./ConditionalAppContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "OH",
  description: "Immersive environments for commerce and culture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${beVietnamPro.variable} antialiased`}
      >
        {process.env.NODE_ENV === 'production' && (
          <Script
            src="/disable-devtools.js"
            strategy="beforeInteractive"
          />
        )}
        <ConditionalAppContent>{children}</ConditionalAppContent>
      </body>
    </html>
  );
}
