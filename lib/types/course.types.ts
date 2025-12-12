export type ClassLevel = 'SD' | 'SMP' | 'SMA' | 'University';

export interface Classroom {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName: string; // Denormalized for easier display
  level: ClassLevel;
  studentCount: number;
  students: string[]; // Array of student user IDs
  createdAt: number;
  
  // New Fields for Categorization (Sesuai kode lama + baru)
  category?: string; 
  gradeLevel?: ClassLevel | 'umum';
  code?: string; // Tambahan agar tidak error di ClassDetailClient

  bannerUrl?: string; // Optional banner image for the class
  themeColor?: string; // Optional custom theme color
}

// --- MATERIALS ---

export type MaterialType = 'pdf' | 'video' | 'link' | 'rich-text' | 'map' | 'image';

export interface Material {
  id: string;
  classId: string;
  title: string;
  description?: string;
  type: MaterialType;
  url?: string; // For PDF, Video, Link, Image
  content?: string; // For Rich Text HTML
  locationData?: {
    lat: number;
    lng: number;
    zoom: number;
    placeName: string;
  }; // Specific for Map type
  createdAt: number;
  attachments?: { name: string; url: string; type: string }[];
}

// --- ASSIGNMENTS & QUIZZES ---

export type AssignmentType = 'quiz' | 'essay' | 'project' | 'game';

export type QuestionType = 'multiple-choice' | 'short-answer' | 'true-false' | 'arrange' | 'drag-match';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  text: string;
  mediaUrl?: string; // Image or Audio for the question context
  
  options?: string[]; // For multiple choice, arrange, drag-match
  correctAnswer: string | number | string[]; // Flexible: index (number), text (string), or order (array)
  
  explanation?: string; // Feedback shown after grading
  points: number;
}

export type GameType = 'word-scramble' | 'memory-match' | 'flashcard-challenge';

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  type: AssignmentType;
  dueDate: number;
  points: number;
  
  // Content specific to types
  questions?: QuizQuestion[]; // For 'quiz' type
  
  gameConfig?: {
    gameType: GameType;
    data: any; // Flexible data depending on game type (e.g., list of words for scramble)
  }; // For 'game' type
  
  createdAt: number;
  submissionsCount: number; // Denormalized counter
}

// --- SUBMISSIONS ---

export type SubmissionStatus = 'submitted' | 'graded' | 'late';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: number;
  status: SubmissionStatus;
  
  // Content submitted by student
  content?: string; // Text for essay/short answer
  attachmentUrl?: string; // File URL for project
  
  // Updated to support flexible quiz answers
  quizAnswers?: { 
    questionId: string; 
    answer: string | number | string[]; 
  }[]; 
  
  grade?: number;
  feedback?: string;
}