import React from "react";
import LearnClient from "./LearnClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Belajar | Skoola LMS",
  description: "Peta belajar interaktif dan manajemen kelas.",
};

export default function LearnPage() {
  return (
    <main className="bg-background min-h-screen">
      <LearnClient />
    </main>
  );
}