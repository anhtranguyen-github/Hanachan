export interface UserProfile {
  id: string;
  name: string | null;
  preferences: string[];
  goals: string[];
  interests: string[];
  facts: string[];
}
