import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  Hash, 
  ChevronDown, 
  ChevronRight, 
  School, 
  GraduationCap, 
  Users, 
  BookOpen,
  MessageSquare,
  Volume2,
  Lock,
  Building2, // Icon untuk Fakultas/Prodi
  Briefcase // Icon untuk Organisasi/BEM/OSIS
} from 'lucide-react';
import { ForumChannel, ChannelType } from '@/lib/types/forum.types';

// Extended Interface untuk mengakomodasi field baru 'groupName'
interface ForumChannelExtended extends ForumChannel {
  groupName?: string;
  category?: 'announcement' | 'discussion';
  schoolId?: string; // Pastikan ini ada
}

interface ForumSidebarProps {
  channels: ForumChannelExtended[];
  activeChannelId?: string;
  userRole?: 'student' | 'teacher' | 'admin';
  isLoading?: boolean;
  userSchoolId?: string;
  schoolType?: 'sd' | 'smp' | 'sma' | 'uni'; // NEW PROP
}

type ServerGroup = {
  id: string; // parentId
  name: string; // groupName
  type: ChannelType;
  channels: ForumChannelExtended[];
};

export default function ForumSidebar({ 
  channels, 
  activeChannelId,
  userRole = 'student',
  isLoading = false,
  userSchoolId,
  schoolType = 'sd' // Default SD
}: ForumSidebarProps) {
  
  // State untuk expand/collapse Kategori Utama
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    school: true,
    faculty: true,
    class: true,
    group: true,
    org: true // New section for Organizations
  });

  // State untuk expand/collapse Server/Grup individual
  const [expandedServers, setExpandedServers] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleServer = (serverKey: string) => {
    setExpandedServers(prev => ({
      ...prev,
      [serverKey]: !prev[serverKey]
    }));
  };

  // LOGIC: Grouping Flat Channels menjadi Servers
  const groupedServers = useMemo(() => {
    const groups: Record<string, ServerGroup> = {};
    const standaloneChannels: ForumChannelExtended[] = [];

    channels.forEach(channel => {
      // --- FILTERING LOGIC (CLIENT SIDE) ---
      // Jika user terikat sekolah, sembunyikan channel dari sekolah lain
      if (userSchoolId && channel.schoolId && channel.schoolId !== userSchoolId) {
         return; 
      }
      
      // Role-based visibility (Opsional, bisa dikembangkan)
      // if (channel.isLocked && userRole === 'student') return; // Contoh filter strict

      // Jika punya parentId dan groupName, masukkan ke grup server
      if (channel.parentId && channel.groupName) {
        const uniqueGroupKey = `${channel.parentId}_${channel.groupName}`;
        
        if (!groups[uniqueGroupKey]) {
          groups[uniqueGroupKey] = {
            id: uniqueGroupKey,
            name: channel.groupName,
            type: channel.type,
            channels: []
          };
        }
        groups[uniqueGroupKey].channels.push(channel);
      } else {
        standaloneChannels.push(channel);
      }
    });

    // Urutkan channel di dalam setiap server
    Object.values(groups).forEach(group => {
      group.channels.sort((a, b) => {
        if (a.isLocked && !b.isLocked) return -1;
        if (!a.isLocked && b.isLocked) return 1;
        return 0;
      });
    });

    return { groups, standaloneChannels };
  }, [channels, userSchoolId]);

  // Helper untuk mengambil list server berdasarkan tipe
  const getServersByType = (type: ChannelType) => {
    return Object.values(groupedServers.groups).filter(server => server.type === type);
  };

  // --- ADAPTIVE LABELS ---
  const getLabel = (key: string) => {
      if (schoolType === 'uni') {
          if (key === 'faculty') return "Fakultas / Prodi";
          if (key === 'class') return "Kelas Kuliah";
          if (key === 'org') return "Organisasi / UKM";
          if (key === 'school') return "Kampus";
      }
      if (key === 'faculty') return "Jurusan"; // SMA/SMK
      if (key === 'org') return "Ekskul & OSIS";
      if (key === 'school') return "Sekolah";
      return "Kelas";
  };

  const getIcon = (key: string) => {
      if (key === 'faculty') return schoolType === 'uni' ? Building2 : GraduationCap;
      if (key === 'org') return Briefcase;
      if (key === 'class') return BookOpen;
      if (key === 'group') return Users;
      return School;
  };

  // Komponen: Single Channel Item (Child)
  const ChannelItem = ({ channel }: { channel: ForumChannelExtended }) => {
    const isActive = activeChannelId === channel.id;
    const isAnnouncement = channel.isLocked || channel.category === 'announcement';
    const Icon = isAnnouncement ? Volume2 : Hash;
    
    return (
      <Link 
        href={`/forum?channelId=${channel.id}`}
        className={cn(
          "group flex items-center px-2 py-1.5 mb-0.5 rounded-md text-sm transition-colors ml-4 border-l-2 border-transparent",
          isActive 
            ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-blue-500" 
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        )}
      >
        <Icon className={cn("mr-2 h-3.5 w-3.5", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400")} />
        <span className="truncate">{channel.name}</span>
        {channel.isLocked && (
          <Lock className="ml-auto h-3 w-3 text-slate-400 opacity-50" />
        )}
      </Link>
    );
  };

  // Komponen: Server Group Item (Parent)
  const ServerItem = ({ server }: { server: ServerGroup }) => {
    const isExpanded = expandedServers[server.id] !== false; 

    return (
      <div className="mb-3">
        <button 
          onClick={() => toggleServer(server.id)}
          className="flex items-center w-full px-2 py-1 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronDown className="h-3 w-3 mr-1 opacity-50" /> : <ChevronRight className="h-3 w-3 mr-1 opacity-50" />}
          <span className="truncate">{server.name}</span>
        </button>
        
        {isExpanded && (
          <div className="mt-1 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
            {server.channels.map(channel => (
              <ChannelItem key={channel.id} channel={channel} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Komponen: Section Kategori Utama
  const SidebarSection = ({ 
    type, 
    idKey // Key for label & icon lookup
  }: { 
    type: ChannelType; 
    idKey: string;
  }) => {
    const servers = getServersByType(type);
    if (servers.length === 0) return null;

    const isExpanded = expandedSections[idKey];
    const Icon = getIcon(idKey);

    return (
      <div className="mb-6">
        <button 
          onClick={() => toggleSection(idKey)}
          className="flex items-center w-full px-2 mb-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <Icon className="h-3 w-3 mr-2" />
          {getLabel(idKey)}
          <span className="ml-auto text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 rounded-full text-slate-500">
            {servers.length}
          </span>
        </button>
        
        {isExpanded && (
          <div className="space-y-1">
            {servers.map(server => (
              <ServerItem key={server.id} server={server} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-64 h-full bg-slate-50 dark:bg-slate-900 p-4 border-r border-slate-200 dark:border-slate-800">
        <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-8" />
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-6">
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-3" />
            <div className="space-y-2 pl-4">
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-64 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto custom-scrollbar">
      {/* Header Sidebar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
          Forum {schoolType === 'uni' ? 'Kampus' : 'Sekolah'}
        </h2>
        <p className="text-xs text-slate-500 mt-1 pl-7">
          {userRole === 'student' ? (schoolType === 'uni' ? 'Area Mahasiswa' : 'Area Siswa') : userRole === 'teacher' ? (schoolType === 'uni' ? 'Area Dosen' : 'Area Guru') : 'Area Admin'}
        </p>
      </div>

      {/* List Channel */}
      <div className="flex-1 p-3">
        {/* 1. Level Sekolah/Kampus */}
        <SidebarSection type="school" idKey="school" />

        {/* 2. Level Fakultas/Jurusan */}
        <SidebarSection type="faculty" idKey="faculty" />

        {/* 3. Level Kelas */}
        <SidebarSection type="class" idKey="class" />
        
        {/* 4. Level Organisasi (New for Uni) */}
        {/* Asumsikan kita punya tipe channel baru 'org' atau mapping existing */}
        
        {/* 5. Level Kelompok */}
        <SidebarSection type="group" idKey="group" />
        
        {/* Empty State */}
        {channels.length === 0 && (
          <div className="text-center py-12 px-4 opacity-50">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <p className="text-xs text-slate-500">Belum ada forum yang diikuti.</p>
          </div>
        )}
      </div>
    </div>
  );
}