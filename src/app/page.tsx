"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main>
      <Link href="/comparison">Deck Comparison Tool</Link>
      <div className="text-xl font-bold underline">
        testing tailwind installed
      </div>
    </main>
  );
}
