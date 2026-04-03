export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company_id: number;
  company_name: string;
  is_admin: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  allocatedTime?: number;
  timeSpent: number;
  createdAt: string;
  updatedAt: string;
  created_by?: { id: number; name: string };
  assigned_users?: { id: number; name: string }[];
}
