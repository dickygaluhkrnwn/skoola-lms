import React from 'react';
import ForumLayoutClient from './ForumLayoutClient';

export const metadata = {
  title: 'Forum Diskusi | Skoola LMS',
  description: 'Ruang diskusi dan kolaborasi siswa dan guru.',
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