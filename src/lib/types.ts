export interface User {
  id: string;
  name: string;
  role: 'admin' | 'employee';
  department: string;
  avatarUrl: string;
}

export type JobStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

export interface Job {
  jobId: string;
  customerName: string;
  description: string;
  quantity: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate: string;
  createdAt: string;
  status: JobStatus;
}

export interface Process {
  processId: string;
  processName: string;
  sequenceNumber: number;
}

export type JobProcessStatus = 'Pending' | 'In Progress' | 'Completed' | 'Rejected';

export interface JobProcess {
  id: string;
  jobId: string;
  processId: string;
  assignedTo: string | null; // User ID
  status: JobProcessStatus;
  startTime: string | null;
  endTime: string | null;
  remarks: string | null;
}

export interface JobWithProcesses extends Job {
  processes: JobProcess[];
}
