import React from "react";
// Pastikan path import benar. Karena berada di folder yang sama, ./StudentAssignmentClient sudah benar.
// Kita tambahkan validasi export.
import StudentAssignmentClient from "./StudentAssignmentClient";

interface PageProps {
  params: Promise<{
    classId: string;
    assignmentId: string;
  }>;
}

export default async function StudentAssignmentPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  // Pastikan komponen yang dirender valid
  if (!StudentAssignmentClient) {
    return <div>Error: Komponen Client tidak ditemukan.</div>;
  }

  return (
    <StudentAssignmentClient 
      classId={resolvedParams.classId} 
      assignmentId={resolvedParams.assignmentId} 
    />
  );
}