"use client";

import Link from "next/link";
import { Button } from "../components/Button";

export default function Home() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Pokémon Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Deck Comparison
          </h2>
          <p className="text-gray-600 mb-4">
            Compare multiple Pokémon TCG decks side by side to see the
            differences and similarities.
          </p>
          <Link href="/comparison">
            <Button>Open Comparison Tool</Button>
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Saved Decks
          </h2>
          <p className="text-gray-600 mb-4">
            Manage your collection of saved Pokémon TCG decks. Import, export,
            and organise your decks.
          </p>
          <Link href="/saved-decks">
            <Button variant="secondary">Manage Saved Decks</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
