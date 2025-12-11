import React from "react";
import AssignmentBuilderClient from "./AssignmentBuilderClient";

interface PageProps {
  params: Promise<{
    classId: string;
    assignmentId: string;
  }>;
}

export default async function AssignmentBuilderPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  return (
    <AssignmentBuilderClient 
      classId={resolvedParams.classId} 
      assignmentId={resolvedParams.assignmentId} 
    />
  );
}