import React from "react";
import ArenaClient from "./ArenaClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skoola Arena | Kompetisi & Tantangan",
  description: "Tantang dirimu dan banggakan sekolahmu di Arena Musiman Skoola.",
};

export default function ArenaPage() {
  return (
    <main className="bg-background min-h-screen">
      <ArenaClient />
    </main>
  );
}