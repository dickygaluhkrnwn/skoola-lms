import React from "react";
import DashboardClient from "./DashboardClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Utama | Skoola LMS",
  description: "Pusat aktivitas dan statistik belajarmu.",
};

export default function DashboardPage() {
  return (
    <main className="bg-background min-h-screen">
      <DashboardClient />
    </main>
  );
}