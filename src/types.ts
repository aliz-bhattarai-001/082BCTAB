export type UserRole = "admin" | "moderator" | "cr" | "locus_cr" | "student";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  skills: string[];
  socials: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  rollNumber?: string; // 3-digit, zero-padded e.g. "013"
  batchYear?: string; // e.g. "082"
  createdAt?: any;
}

export interface UserRoleRecord {
  uid: string;
  email: string;
  role: UserRole;
  grantedBy: string;
  grantedAt: any;
}

export interface ExceptionEmail {
  email: string;
  addedBy: string;
  addedAt: any;
}

export interface Project {
  id: string;
  ownerUid: string;
  ownerName: string;
  ownerEmail: string;
  title: string;
  description: string;
  tags: string[];
  date: string; // ISO date or simple string
  stars: number;
  starredBy: string[]; // List of UIDs who starred it
  createdAt: any;
}

export interface ClassEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  description: string;
  photos: string[]; // base64 or URL strings
  createdBy: string;
  createdByEmail: string;
  createdAt: any;
  tags?: string[];
}

export interface Message {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  timestamp: any;
}

export interface Showcase {
  uid: string;
  html: string;
  css: string;
  updatedAt: any;
}
