import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grafos — Aeroportos BR",
  description: "Rede de Aeroportos do Brasil · Teoria dos Grafos | Cesar School",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-[#060d1f] text-white">{children}</body>
    </html>
  );
}
