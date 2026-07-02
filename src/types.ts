export type UserRole = "admin" | "student";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Standard {
  id: string; // e.g., "grade-9"
  name: string; // e.g., "Grade 9"
  order: number;
}

export interface Subject {
  id: string; // e.g., "grade-9_physics"
  standardId: string; // e.g., "grade-9"
  name: string; // e.g., "Physics"
  order: number;
}

export interface Chapter {
  id: string; // e.g., "grade-9_physics_mechanics"
  subjectId: string; // e.g., "grade-9_physics"
  name: string; // e.g., "Mechanics"
  order: number;
}

export interface Topic {
  id: string; // e.g., "grade-9_physics_mechanics_newton-laws"
  chapterId: string; // e.g., "grade-9_physics_mechanics"
  name: string; // e.g., "Newton's Laws of Motion"
  order: number;
  hasSimulation: boolean;
}

export interface Simulation {
  id: string; // matches topicId
  topicId: string;
  fileName: string;
  content: string; // raw html or tsx string
  type: "html" | "tsx";
  uploadedBy: string; // email or uid
  uploadedAt: string;
  version: number;
}
