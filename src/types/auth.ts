export interface AuthUser {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
}

export interface Session {
  user: AuthUser;
  provider: 'google' | 'mock';
  issuedAt: number;
}
