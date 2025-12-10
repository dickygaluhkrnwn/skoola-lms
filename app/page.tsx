import React from 'react';
import AuthClient from '@/app/auth/AuthClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Masuk atau Daftar | Skoola LMS",
  description: "Platform belajar interaktif dengan gamifikasi seru untuk siswa dan guru.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <AuthClient />
    </main>
  );
}