import { db } from "@/lib/firebase";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";

// --- KONFIGURASI LEVEL ---
// Level 1: 0 - 100 XP
// Level 2: 101 - 300 XP
// Level 3: 301 - 600 XP, dst.
const BASE_XP = 100;
const MULTIPLIER = 1.5; 

export interface LevelInfo {
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  progressPercent: number;
}

/**
 * Menghitung Level saat ini berdasarkan Total XP
 * Rumus sederhana: Target XP meningkat seiring level
 */
export function calculateLevelInfo(totalXP: number): LevelInfo {
  let level = 1;
  let xpForNextLevel = BASE_XP;
  let xpAccumulated = 0;

  // Loop untuk mencari level saat ini
  while (totalXP >= xpAccumulated + xpForNextLevel) {
    xpAccumulated += xpForNextLevel;
    level++;
    xpForNextLevel = Math.floor(xpForNextLevel * MULTIPLIER);
  }

  const currentXPInLevel = totalXP - xpAccumulated;
  const progressPercent = Math.min((currentXPInLevel / xpForNextLevel) * 100, 100);

  return {
    currentLevel: level,
    currentXP: currentXPInLevel,
    nextLevelXP: xpForNextLevel,
    progressPercent: Math.round(progressPercent),
  };
}

/**
 * Menambahkan XP ke user di Firestore
 * @param userId UID user dari Auth
 * @param amount Jumlah XP yang didapat (misal: 10, 50)
 */
export async function addUserXP(userId: string, amount: number) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      xp: increment(amount),
      lastActive: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Gagal update XP:", error);
    return false;
  }
}

/**
 * Menjaga Streak Harian
 * Logika: Jika login hari ini > login terakhir (kemarin), tambah streak.
 * Jika bolong sehari, reset ke 1.
 */
export async function updateStreak(userId: string) {
  // Logic streak ini bisa kita kembangkan lebih detail di Fase 3
  // Untuk sekarang kita pakai increment sederhana saat login
  const userRef = doc(db, "users", userId);
  // (Implementasi detail butuh cek tanggal, kita simpan kerangkanya dulu)
}