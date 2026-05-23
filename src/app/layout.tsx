import type { Metadata } from "next";
import { ConvexClientProvider } from "../components/ConvexClientProvider";
import { Navigation } from "../features/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokémon TCG Tools",
  description: "Tools for Pokémon TCG deck analysis and comparison",
  keywords: "pokemon, tcg, trading card game, matchup tracker",
  authors: [{ name: "Eddcakes" }],
  openGraph: {
    title: "Pokémon TCG Tools",
    description: "Tools for Pokémon Trading Card Game players",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen isolate">
        <ConvexClientProvider>
          <Navigation />
          <main>{children}</main>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
