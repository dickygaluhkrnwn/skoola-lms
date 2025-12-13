import React from 'react';
import ForumLayoutClient from './ForumLayoutClient';

export const metadata = {
  title: 'Forum Sekolah | Skoola LMS',
  description: 'Diskusi dan kolaborasi sekolah',
};

export default function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ForumLayoutClient>
      {children}
    </ForumLayoutClient>
  );
}