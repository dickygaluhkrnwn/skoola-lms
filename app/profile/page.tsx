import React from "react";
import ProfileClient from "./ProfileClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Saya | Skoola LMS",
  description: "Kelola data diri dan lihat pencapaian belajarmu.",
};

export default function ProfilePage() {
  return (
    <main className="bg-background min-h-screen">
      <ProfileClient />
    </main>
  );
}