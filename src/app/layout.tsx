import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CAC Validador v2.0 — Validación de Reportes de Cáncer",
  description:
    "Sistema de validación de reportes de cáncer para la Cuenta de Alto Costo (CAC) de Colombia. Resolución 0247/2014.",
  keywords: [
    "CAC",
    "Cuenta de Alto Costo",
    "cáncer",
    "validación",
    "EAPB",
    "Resolución 0247",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
