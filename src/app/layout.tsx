import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/space-grotesk";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dyvi Plataforma",
  description: "Gestão de estratégia e conteúdos dos clientes da Dyvi Growth Studio",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
