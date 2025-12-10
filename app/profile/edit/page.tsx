import React from "react";
import EditProfileClient from "./EditProfileClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Profil | Skoola LMS",
  description: "Perbarui informasi dan preferensi akun Anda.",
};

export default function EditProfilePage() {
  return (
    <main className="bg-background min-h-screen">
      <EditProfileClient />
    </main>
  );
}