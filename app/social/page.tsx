"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Heart, MessageCircle } from "lucide-react";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

// --- MOCK DATA ---
const mockFeed = [
  {
    id: 1,
    user: "Budi Santoso",
    avatar: "👨‍🎓",
    action: "naik ke Level 2!",
    time: "2 jam yang lalu",
    likes: 12,
    comments: 2,
    type: "levelup"
  },
  {
    id: 2,
    user: "Siti Aminah",
    avatar: "👩‍🏫",
    action: "menyelesaikan modul 'Keluargaku'",
    time: "5 jam yang lalu",
    likes: 24,
    comments: 5,
    type: "module_complete"
  },
  {
    id: 3,
    user: "Joko Anwar",
    avatar: "🧑‍🎨",
    action: "mendapat lencana 'Api Semangat' 🔥",
    time: "1 hari yang lalu",
    likes: 8,
    comments: 0,
    type: "badge"
  }
];

const mockLeaderboard = [
  { id: 1, name: "Siti Aminah", xp: 2400, avatar: "👩‍🏫" },
  { id: 2, name: "Budi Santoso", xp: 1850, avatar: "👨‍🎓" },
  { id: 3, name: "Asep Knalpot", xp: 1200, avatar: "👨‍🔧" },
  { id: 4, name: "Dewi Sri", xp: 900, avatar: "👩‍🌾" },
];

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<"feed" | "leaderboard">("feed");

  return (
    <div className="flex min-h-screen bg-sky-50 font-sans text-gray-800">
      
      {/* 1. SIDEBAR (Desktop) */}
      <StudentSidebar />

      {/* 2. CONTENT WRAPPER */}
      <div className="flex-1 md:ml-64 relative pb-24">
        
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-sky-100 shadow-sm px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-sky-900 flex items-center gap-2">
            <Users className="text-sky-500" /> Komunitas
          </h1>
          <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-xl">
             😎
          </div>
        </header>

        <div className="max-w-md mx-auto px-4 pt-6">
          
          {/* TABS NAVIGATION */}
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-sky-100 mb-6">
            <button
              onClick={() => setActiveTab("feed")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "feed" ? "bg-sky-100 text-sky-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              Kabar Teman
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "leaderboard" ? "bg-yellow-100 text-yellow-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              Peringkat
            </button>
          </div>

          {/* VIEW 1: FEED */}
          {activeTab === "feed" && (
            <div className="space-y-4">
              {/* Input Post */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-sky-50 flex gap-3 items-center">
                 <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center">😎</div>
                 <input placeholder="Bagikan pencapaianmu..." className="flex-1 bg-gray-50 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-sky-200 outline-none transition-all" />
              </div>

              {/* Posts List */}
              {mockFeed.map((post, idx) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-sky-50"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl">
                      {post.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{post.user}</p>
                      <p className="text-xs text-gray-500">{post.time}</p>
                    </div>
                    {post.type === "levelup" && <Trophy size={16} className="ml-auto text-yellow-500" />}
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-4">
                    Baru saja <span className="font-bold text-sky-600">{post.action}</span>
                  </p>

                  <div className="flex items-center gap-4 border-t border-gray-100 pt-3">
                    <button className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-pink-500 transition-colors">
                      <Heart size={16} /> {post.likes}
                    </button>
                    <button className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-sky-500 transition-colors">
                      <MessageCircle size={16} /> {post.comments}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* VIEW 2: LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <div className="space-y-3">
              {mockLeaderboard.map((user, idx) => (
                <motion.div 
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${idx === 0 ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-100 shadow-sm"}`}
                >
                  <div className={`font-bold text-lg w-6 text-center ${idx === 0 ? "text-yellow-600" : "text-gray-400"}`}>
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{user.xp} XP</p>
                  </div>
                  {idx < 3 && <Trophy size={20} className={idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : "text-orange-500"} />}
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* 3. BOTTOM NAV (Mobile) */}
      <MobileNav />

    </div>
  );
}