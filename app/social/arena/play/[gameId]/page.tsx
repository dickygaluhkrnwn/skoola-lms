import React from "react";
import ArenaGameClient from "./ArenaGameClient";
import { Metadata } from "next";

// Helper untuk metadata dinamis
export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const { gameId } = await params;
  
  // Mapping nama game (Sederhana)
  const gameNames: Record<string, string> = {
    "quick-trivia": "Cerdas Cermat",
    "math-rush": "Math Rush",
    "word-match": "Cocok Kata",
    "word-find": "Cari Kata"
  };

  return {
    title: `Main ${gameNames[gameId] || "Game"} | Skoola Arena`,
    description: "Selesaikan tantangan dan raih poin tertinggi!",
  };
}

export default async function ArenaPlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  // Await params di Next.js 15/App Router terbaru
  const { gameId } = await params;

  return (
    <main className="bg-background min-h-screen">
      <ArenaGameClient gameId={gameId} />
    </main>
  );
}