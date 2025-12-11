import React from "react";
import AssignmentGradingClient from "./AssignmentGradingClient";

interface PageProps {
  params: Promise<{
    classId: string;
    assignmentId: string;
  }>;
}

export default async function AssignmentGradingPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  return (
    <AssignmentGradingClient 
      classId={resolvedParams.classId} 
      assignmentId={resolvedParams.assignmentId} 
    />
  );
}