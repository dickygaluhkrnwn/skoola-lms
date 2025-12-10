import React from "react";
import SocialClient from "./SocialClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Komunitas & Peringkat | Skoola LMS",
  description: "Lihat peringkatmu dan kabar terbaru dari teman-teman belajar.",
};

export default function SocialPage() {
  return (
    <main className="bg-background min-h-screen">
      <SocialClient />
    </main>
  );
}