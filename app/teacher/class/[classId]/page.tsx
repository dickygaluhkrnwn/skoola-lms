import React from "react";
import ClassDetailClient from "./ClassDetailClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Kelas | Ruang Guru",
  description: "Kelola materi dan siswa dalam kelas ini.",
};

type Props = {
  params: Promise<{ classId: string }>;
};

export default async function ClassDetailPage({ params }: Props) {
  // Await params untuk kompatibilitas Next.js modern
  const resolvedParams = await params;

  return (
    <main className="bg-slate-50 min-h-screen">
      <ClassDetailClient classId={resolvedParams.classId} />
    </main>
  );
}