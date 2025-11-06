"use client";

import { Card, Link } from "../components";

export default function Home() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Pokémon Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Deck Comparison
          </h2>
          <p className="text-gray-600 mb-4">
            Compare multiple Pokémon TCG decks side by side to see the
            differences and similarities.
          </p>
          <Link variant="button" href="/comparison">
            Open Comparison Tool
          </Link>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Saved Decks
          </h2>
          <p className="text-gray-600 mb-4">
            Manage your collection of saved Pokémon TCG decks. Import, export,
            and organise your decks.
          </p>
          <Link variant="button" href="/saved-decks">
            Manage Saved Decks
          </Link>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Matchup Log
          </h2>
          <p className="text-gray-600 mb-4">
            Track your matchup results against different archetypes to analyse
            your deck's performance.
          </p>
          <Link variant="button" href="/matchup-records">
            Matchup Log
          </Link>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Useful links
          </h2>
          <p className="text-gray-600 mb-4">-</p>
          <ul>
            <li>
              <Link href="https://rk9.gg/">rk9</Link>
            </li>
            <li>
              <Link href="https://www.trainerhill.com/">trainer hill</Link>
            </li>
            <li>
              <Link href="https://limitlesstcg.com/">limitless</Link>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
