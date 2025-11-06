import type { Metadata } from "next";
import { Navigation } from "../features/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokémon Tools",
  description: "Tools for Pokémon TCG deck analysis and comparison",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
