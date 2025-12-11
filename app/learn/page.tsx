import React from "react";
import LearnClient from "./LearnClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Sekolah | Skoola LMS",
  description: "Pusat aktivitas belajar, jadwal, dan tugas sekolah.",
};

export default function LearnPage() {
  return (
    <main className="bg-background min-h-screen">
      <LearnClient />
    </main>
  );
}