import React from 'react';
import AdminSchoolClient from './AdminSchoolClient';

export const metadata = {
  title: 'Dashboard Operator Sekolah | Skoola LMS',
  description: 'Pusat kontrol manajemen sekolah, pengguna, dan akademik.',
};

export default function AdminSchoolPage() {
  return (
    <AdminSchoolClient />
  );
}