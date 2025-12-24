import { User, Job, Process, JobProcess } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { addDays, subDays, formatISO } from 'date-fns';

const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-1')?.imageUrl || 'https://picsum.photos/seed/user-avatar-1/100/100';

let users: User[] = [
  { id: 'user-1', name: 'Admin User', role: 'admin', department: 'Management', avatarUrl: userAvatar },
  { id: 'user-2', name: 'Alice', role: 'employee', department: 'Design', avatarUrl: userAvatar },
  { id: 'user-3', name: 'Bob', role: 'employee', department: 'Approval', avatarUrl: userAvatar },
  { id: 'user-4', name: 'Charlie', role: 'employee', department: 'Material Check', avatarUrl: userAvatar },
  { id: 'user-5', name: 'David', role: 'employee', department: 'Cutting', avatarUrl: userAvatar },
  { id: 'user-6', name: 'Eve', role: 'employee', department: 'Machining', avatarUrl: userAvatar },
  { id: 'user-7', name: 'Frank', role: 'employee', department: 'Assembly', avatarUrl: userAvatar },
  { id: 'user-8', name: 'Grace', role: 'employee', department: 'Quality Control (QC)', avatarUrl: userAvatar },
  { id: 'user-9', name: 'Heidi', role: 'employee', department: 'Finishing', avatarUrl: userAvatar },
  { id: 'user-10', name: 'Ivan', role: 'employee', department: 'Painting', avatarUrl: userAvatar },
  { id: 'user-11', name: 'Judy', role: 'employee', department: 'Drying/Curing', avatarUrl: userAvatar },
  { id: 'user-12', name: 'Mallory', role: 'employee', department: 'Final Assembly', avatarUrl: userAvatar },
  { id: 'user-13', name: 'Niaj', role: 'employee', department: 'Final QC', avatarUrl: userAvatar },
  { id: 'user-14', name: 'Olivia', role: 'employee', department: 'Labeling', avatarUrl: userAvatar },
  { id: 'user-15', name: 'Peggy', role: 'employee', department: 'Packing', avatarUrl: userAvatar },
  { id: 'user-16', name: 'Sybil', role: 'employee', department: 'Dispatch Prep', avatarUrl: userAvatar },
  { id: 'user-17', name: 'Trent', role: 'employee', department: 'Documentation', avatarUrl: userAvatar },
  { id: 'user-18', name: 'Walter', role: 'employee', department: 'Shipping', avatarUrl: userAvatar },
];

let processes: Process[] = [
  { processId: 'proc-1', processName: 'Design', sequenceNumber: 1 },
  { processId: 'proc-2', processName: 'Approval', sequenceNumber: 2 },
  { processId: 'proc-3', processName: 'Material Check', sequenceNumber: 3 },
  { processId: 'proc-4', processName: 'Cutting', sequenceNumber: 4 },
  { processId: 'proc-5', processName: 'Machining', sequenceNumber: 5 },
  { processId: 'proc-6', processName: 'Assembly', sequenceNumber: 6 },
  { processId: 'proc-7', processName: 'Quality Control (QC)', sequenceNumber: 7 },
  { processId: 'proc-8', processName: 'Finishing', sequenceNumber: 8 },
  { processId: 'proc-9', processName: 'Painting', sequenceNumber: 9 },
  { processId: 'proc-10', processName: 'Drying/Curing', sequenceNumber: 10 },
  { processId: 'proc-11', processName: 'Final Assembly', sequenceNumber: 11 },
  { processId: 'proc-12', processName: 'Final QC', sequenceNumber: 12 },
  { processId: 'proc-13', processName: 'Labeling', sequenceNumber: 13 },
  { processId: 'proc-14', processName: 'Packing', sequenceNumber: 14 },
  { processId: 'proc-15', processName: 'Dispatch Prep', sequenceNumber: 15 },
  { processId: 'proc-16', processName: 'Documentation', sequenceNumber: 16 },
  { processId: 'proc-17', processName: 'Shipping', sequenceNumber: 17 },
];

let jobs: Job[] = [
  {
    jobId: 'job-001',
    customerName: 'Innovate Corp',
    description: 'Custom gear housing for new engine model. Requires high precision machining.',
    quantity: 50,
    priority: 'High',
    dueDate: formatISO(addDays(new Date(), 10)),
    createdAt: formatISO(subDays(new Date(), 5)),
    status: 'In Progress',
  },
  {
    jobId: 'job-002',
    customerName: 'BuildRight Inc.',
    description: 'Standard mounting brackets. Bulk order.',
    quantity: 1000,
    priority: 'Medium',
    dueDate: formatISO(addDays(new Date(), 25)),
    createdAt: formatISO(subDays(new Date(), 2)),
    status: 'In Progress',
  },
  {
    jobId: 'job-003',
    customerName: 'AeroSpace Solutions',
    description: 'Prototype turbine blades. Urgent request.',
    quantity: 5,
    priority: 'Urgent',
    dueDate: formatISO(subDays(new Date(), 1)), // Overdue
    createdAt: formatISO(subDays(new Date(), 10)),
    status: 'Overdue',
  },
    {
    jobId: 'job-004',
    customerName: 'Completed Works',
    description: 'A job that is fully completed.',
    quantity: 100,
    priority: 'Low',
    dueDate: formatISO(subDays(new Date(), 15)),
    createdAt: formatISO(subDays(new Date(), 30)),
    status: 'Completed',
  },
];

let jobProcesses: JobProcess[] = [
  // Job 1
  { id: 'jp-1-1', jobId: 'job-001', processId: 'proc-1', assignedTo: 'user-2', status: 'Completed', startTime: formatISO(subDays(new Date(), 5)), endTime: formatISO(subDays(new Date(), 4)), remarks: 'Initial design approved.' },
  { id: 'jp-1-2', jobId: 'job-001', processId: 'proc-2', assignedTo: 'user-3', status: 'Completed', startTime: formatISO(subDays(new Date(), 4)), endTime: formatISO(subDays(new Date(), 4)), remarks: null },
  { id: 'jp-1-3', jobId: 'job-001', processId: 'proc-3', assignedTo: 'user-4', status: 'In Progress', startTime: formatISO(subDays(new Date(), 3)), endTime: null, remarks: 'Waiting for material confirmation.' },
  ...processes.slice(3).map(p => ({ id: `jp-1-${p.sequenceNumber}`, jobId: 'job-001', processId: p.processId, assignedTo: null, status: 'Pending' as JobProcessStatus, startTime: null, endTime: null, remarks: null })),
  
  // Job 2
  { id: 'jp-2-1', jobId: 'job-002', processId: 'proc-1', assignedTo: 'user-2', status: 'Completed', startTime: formatISO(subDays(new Date(), 2)), endTime: formatISO(subDays(new Date(), 1)), remarks: null },
  { id: 'jp-2-2', jobId: 'job-002', processId: 'proc-2', assignedTo: 'user-3', status: 'In Progress', startTime: formatISO(subDays(new Date(), 1)), endTime: null, remarks: null },
  ...processes.slice(2).map(p => ({ id: `jp-2-${p.sequenceNumber}`, jobId: 'job-002', processId: p.processId, assignedTo: null, status: 'Pending' as JobProcessStatus, startTime: null, endTime: null, remarks: null })),
  
  // Job 3 (Overdue)
  { id: 'jp-3-1', jobId: 'job-003', processId: 'proc-1', assignedTo: 'user-2', status: 'Completed', startTime: formatISO(subDays(new Date(), 10)), endTime: formatISO(subDays(new Date(), 9)), remarks: null },
  { id: 'jp-3-2', jobId: 'job-003', processId: 'proc-2', assignedTo: 'user-3', status: 'Completed', startTime: formatISO(subDays(new Date(), 9)), endTime: formatISO(subDays(new Date(), 9)), remarks: null },
  { id: 'jp-3-3', jobId: 'job-003', processId: 'proc-3', assignedTo: 'user-4', status: 'Completed', startTime: formatISO(subDays(new Date(), 8)), endTime: formatISO(subDays(new Date(), 7)), remarks: null },
  { id: 'jp-3-4', jobId: 'job-003', processId: 'proc-4', assignedTo: 'user-5', status: 'Rejected', startTime: formatISO(subDays(new Date(), 7)), endTime: formatISO(subDays(new Date(), 6)), remarks: 'Incorrect material specification.' },
  ...processes.slice(4).map(p => ({ id: `jp-3-${p.sequenceNumber}`, jobId: 'job-003', processId: p.processId, assignedTo: null, status: 'Pending' as JobProcessStatus, startTime: null, endTime: null, remarks: null })),

  // Job 4 (Completed)
  ...processes.map(p => ({ id: `jp-4-${p.sequenceNumber}`, jobId: 'job-004', processId: p.processId, assignedTo: `user-${(p.sequenceNumber % 5) + 2}`, status: 'Completed' as JobProcessStatus, startTime: formatISO(subDays(new Date(), 30 - p.sequenceNumber)), endTime: formatISO(subDays(new Date(), 29 - p.sequenceNumber)), remarks: 'All good.' })),
];

// Simulate a database with async functions
export const getUsers = async (): Promise<User[]> => {
  return Promise.resolve(users);
};

export const getJobs = async (): Promise<Job[]> => {
  return Promise.resolve(jobs);
};

export const getJobById = async (id: string): Promise<Job | undefined> => {
    return Promise.resolve(jobs.find(j => j.jobId === id));
};

export const getProcesses = async (): Promise<Process[]> => {
  return Promise.resolve(processes);
};

export const getJobProcesses = async (): Promise<JobProcess[]> => {
  return Promise.resolve(jobProcesses);
};

export const getJobProcessesByJobId = async (jobId: string): Promise<JobProcess[]> => {
    return Promise.resolve(jobProcesses.filter(jp => jp.jobId === jobId));
};


// Actions to modify data
export const addJob = async (jobData: Omit<Job, 'jobId' | 'createdAt' | 'status'>): Promise<Job> => {
  const newJobId = `job-${String(jobs.length + 1).padStart(3, '0')}`;
  const newJob: Job = {
    ...jobData,
    jobId: newJobId,
    createdAt: new Date().toISOString(),
    status: 'In Progress',
  };
  jobs.push(newJob);
  return Promise.resolve(newJob);
};

export const addJobProcesses = async (processesData: JobProcess[]): Promise<void> => {
    jobProcesses.push(...processesData);
    return Promise.resolve();
};
