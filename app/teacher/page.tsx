import React from "react";
import TeacherClient from "./TeacherClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ruang Guru | Skoola LMS",
  description: "Kelola kelas, materi, dan pantau perkembangan murid Anda.",
};

export default function TeacherPage() {
  return (
    <main className="bg-slate-50 min-h-screen">
      <TeacherClient />
    </main>
  );
}