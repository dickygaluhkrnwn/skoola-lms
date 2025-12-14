import React from "react";
import GroupDetailClient from "./GroupDetailClient";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ groupId: string }> }): Promise<Metadata> {
  const { groupId } = await params;
  return {
    title: "Detail Kelompok | Skoola Social",
    description: "Ruang diskusi dan kolaborasi kelompok belajar.",
  };
}

export default async function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return (
    <main className="bg-background min-h-screen">
      <GroupDetailClient groupId={groupId} />
    </main>
  );
}