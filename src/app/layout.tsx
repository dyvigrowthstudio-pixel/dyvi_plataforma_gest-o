import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const space = Space_Grotesk({ variable: "--font-space", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dyvi Plataforma",
  description: "Gestão de estratégia e conteúdos dos clientes da Dyvi Growth Studio",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body className={`${manrope.variable} ${space.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
