import React from "react";
import SchoolProfileClient from "./SchoolProfileClient";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ schoolId: string }> }): Promise<Metadata> {
  const { schoolId } = await params;
  return {
    title: "Profil Sekolah | Skoola LMS",
    description: "Lihat statistik, anggota, dan pencapaian sekolah.",
  };
}

export default async function SchoolProfilePage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  return (
    <main className="bg-background min-h-screen">
      <SchoolProfileClient schoolId={schoolId} />
    </main>
  );
}