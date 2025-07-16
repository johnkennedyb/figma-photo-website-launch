export interface Counselor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  specialties?: string[];
  bio?: string;
  sessionRate?: number;
  // Add any other fields that are relevant to a counselor's profile
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'client' | 'counselor';
  // Add any other fields relevant to a user
}
