import React from "react";
import LessonClient from "./LessonClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mulai Belajar | Skoola LMS",
  description: "Selesaikan misi dan kuis untuk meningkatkan levelmu.",
};

type Props = {
  params: Promise<{ moduleId: string }>;
};

export default async function LessonPage({ params }: Props) {
  // Await params untuk kompatibilitas Next.js 15+
  const resolvedParams = await params;
  
  return (
    <main className="bg-white min-h-screen">
      <LessonClient moduleId={resolvedParams.moduleId} />
    </main>
  );
}