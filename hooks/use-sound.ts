"use client";

import { useCallback } from "react";

// URL Sound Effect (Bisa diganti file lokal nanti)
const SOUNDS = {
  correct: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3", // Suara "Ting!" sukses
  wrong: "https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3",   // Suara "Tetot!" gagal
  click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",   // Suara Klik UI
  levelUp: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3", // Suara Naik Level
};

export function useSound() {
  const playSound = useCallback((type: keyof typeof SOUNDS) => {
    // Cek apakah user mematikan suara di localStorage (Opsional, nanti diintegrasikan)
    const isMuted = localStorage.getItem("skoola-muted") === "true";
    if (isMuted) return;

    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.5; // Set volume 50% biar gak kaget
    
    audio.play().catch((err) => {
      console.warn("Audio play failed:", err);
      // Browser modern memblokir autoplay jika belum ada interaksi user
    });
  }, []);

  return { playSound };
}