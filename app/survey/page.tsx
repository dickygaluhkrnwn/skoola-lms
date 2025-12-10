import React from "react";
import SurveyClient from "./SurveyClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cek Level Bahasa | Skoola LMS",
  description: "Ikuti tes penempatan singkat untuk mengetahui level BIPA (Bahasa Indonesia) kamu.",
};

export default function SurveyPage() {
  return (
    <main className="bg-background min-h-screen">
      <SurveyClient />
    </main>
  );
}