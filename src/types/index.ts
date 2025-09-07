export interface Website {
  id: string;
  url: string;
  title: string;
  category: string;
  description?: string;
  favicon?: string;
  user_id: string;
  created_at: string;
  last_reminded_at?: string;
  reminder_dismissed?: boolean;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}