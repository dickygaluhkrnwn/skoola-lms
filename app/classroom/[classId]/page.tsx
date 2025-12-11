"use client";

import React from "react";
import { useParams } from "next/navigation";
import StudentClassroomClient from "./StudentClassroomClient";

export default function StudentClassroomPage() {
  const params = useParams();
  const classId = params.classId as string;

  return <StudentClassroomClient classId={classId} />;
}