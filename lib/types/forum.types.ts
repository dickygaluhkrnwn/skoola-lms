export type ChannelType = 'school' | 'faculty' | 'class' | 'group';

export interface ForumAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: number;
}

export interface ForumChannel {
  id: string;
  name: string; // Nama Channel (misal: "Pengumuman")
  groupName?: string; // Nama Server/Grup (misal: "Kelas 10-A")
  
  type: ChannelType;

  // Multi-Tenant Isolation
  schoolId?: string; // <-- UPDATE: Field kunci untuk isolasi forum per sekolah
  
  // Hierarki Baru
  forumId?: string; // ID Dokumen Forum Induk (Server ID)
  parentId?: string; // Sama dengan forumId (untuk kompatibilitas)
  
  description?: string;
  createdBy: string; // userId
  moderators: string[]; 
  members?: string[]; // Array UID user yang punya akses
  
  isLocked: boolean; // True = Read Only (Pengumuman)
  category?: 'announcement' | 'discussion'; // Kategori channel
  
  createdAt: any; 
  updatedAt: any;
  
  icon?: string; 
}

export interface ForumMessage {
  id: string;
  channelId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string; 
  senderAvatar?: string;
  attachments?: ForumAttachment[];
  replyToId?: string; 
  replyToName?: string; 
  createdAt: any; 
  updatedAt?: any;
  reactions?: Record<string, string[]>;
  
  // Opsional: Jika kita butuh query message langsung tanpa lewat channel
  schoolId?: string; 
}