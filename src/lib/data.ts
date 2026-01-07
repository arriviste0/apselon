import { User, Job, Process, JobProcess } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { addDays, subDays, formatISO } from 'date-fns';

const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-1')?.imageUrl || 'https://picsum.photos/seed/user-avatar-1/100/100';

let users: User[] = [
    { id: 'user-1', name: 'Admin User', role: 'admin', department: 'Management', avatarUrl: userAvatar },
    { id: 'user-2', name: 'Pre-Engg Team', role: 'employee', department: 'Pre-Engg', avatarUrl: userAvatar },
    { id: 'user-3', name: 'Shearing Team', role: 'employee', department: 'SHEARING', avatarUrl: userAvatar },
    { id: 'user-4', name: 'CNC Team', role: 'employee', department: 'CNC', avatarUrl: userAvatar },
    { id: 'user-5', name: 'PTH Team', role: 'employee', department: 'PTH', avatarUrl: userAvatar },
    { id: 'user-6', name: 'Dry Film Team', role: 'employee', department: 'Dry Film', avatarUrl: userAvatar },
    { id: 'user-7', name: 'Plating Team', role: 'employee', department: 'Plating', avatarUrl: userAvatar },
    { id: 'user-8', name: 'Etching Team', role: 'employee', department: 'ETCHING', avatarUrl: userAvatar },
    { id: 'user-9', name: 'Pre-Mask Q.C. Team', role: 'employee', department: 'Pre-Mask Q.C.', avatarUrl: userAvatar },
    { id: 'user-10', name: 'PISM - Coating Team', role: 'employee', department: 'PISM - Coating', avatarUrl: userAvatar },
    { id: 'user-11', name: 'PISM Expose & Develop Team', role: 'employee', department: 'PISM Expose & Develop', avatarUrl: userAvatar },
    { id: 'user-12', name: 'HAL Team', role: 'employee', department: 'HAL', avatarUrl: userAvatar },
    { id: 'user-13', name: 'HAL Q.C Team', role: 'employee', department: 'HAL Q.C', avatarUrl: userAvatar },
    { id: 'user-14', name: 'Legend Team', role: 'employee', department: 'LEGEND', avatarUrl: userAvatar },
    { id: 'user-15', name: 'Routing Team', role: 'employee', department: 'Routing', avatarUrl: userAvatar },
    { id: 'user-16', name: 'BBT Team', role: 'employee', department: 'BBT', avatarUrl: userAvatar },
    { id: 'user-17', name: 'Q.C Team', role: 'employee', department: 'Q.C', avatarUrl: userAvatar },
    { id: 'user-18', name: 'Packing Team', role: 'employee', department: 'PACKING', avatarUrl: userAvatar },
];

let processes: Process[] = [
    { processId: 'proc-1', processName: 'Pre-Engg', sequenceNumber: 1 },
    { processId: 'proc-2', processName: 'SHEARING', sequenceNumber: 2 },
    { processId: 'proc-3', processName: 'CNC', sequenceNumber: 3 },
    { processId: 'proc-4', processName: 'PTH', sequenceNumber: 4 },
    { processId: 'proc-5', processName: 'Dry Film', sequenceNumber: 5 },
    { processId: 'proc-6', processName: 'Plating', sequenceNumber: 6 },
    { processId: 'proc-7', processName: 'ETCHING', sequenceNumber: 7 },
    { processId: 'proc-8', processName: 'Pre-Mask Q.C.', sequenceNumber: 8 },
    { processId: 'proc-9', processName: 'PISM - Coating', sequenceNumber: 9 },
    { processId: 'proc-10', processName: 'PISM Expose & Develop', sequenceNumber: 10 },
    { processId: 'proc-11', processName: 'HAL', sequenceNumber: 11 },
    { processId: 'proc-12', processName: 'HAL Q.C', sequenceNumber: 12 },
    { processId: 'proc-13', processName: 'LEGEND', sequenceNumber: 13 },
    { processId: 'proc-14', processName: 'Routing', sequenceNumber: 14 },
    { processId: 'proc-15', processName: 'BBT', sequenceNumber: 15 },
    { processId: 'proc-16', processName: 'Q.C', sequenceNumber: 16 },
    { processId: 'proc-17', processName: 'PACKING', sequenceNumber: 17 }
];

let jobs: Job[] = [
  {
    jobId: 'A2511',
    customerName: 'A03 ARVI(VISHAL BHAI)',
    description: 'Custom gear housing for new engine model. Requires high precision machining.',
    partNo: "LL502_R3(LL_WT_503_REV_3)",
    quantity: 700,
    priority: 'High',
    poNo: "WHATSAPP",
    orderDate: "2026-01-03",
    isRepeat: true,
    layerType: 'Double',
    leadTime: "5 DAY",
    refNo: "6",
    launchedPcbs: 768,
    launchedPanels: 32,
    sqMt: 5.60,
    pnlHole: 2651,
    totalHole: 84832,
    pcbSizeWidth: 99.76,
    pcbSizeHeight: 60.70,
    arraySizeWidth: 299.31,
    arraySizeHeight: 242.80,
    upsArrayWidth: 4,
    upsArrayHeight: 3,
    panelSizeWidth: 335,
    panelSizeHeight: 522,
    upsPanel: 24,
    material: "D/S FR4",
    copperWeight: "18/18",
    thickness: 1.60,
    source: "Any",
    ink: "Any",
    ulLogo: false,
    solderMask: "GREEN",
    legendColour: "WHITE",
    legendSide: "BOTH",
    surfaceFinish: "HAL",
    vGrooving: true,
    cutting: "M-CUTTING",
    sheetSizeWidth: 1040,
    sheetSizeHeight: 1240,
    sheetUtilization: 94,
    panelsInSheet: 11,
    supplyInfo: "SUPPLAY IN 12 UPS(2MM ROUTTTING)",
    dueDate: formatISO(addDays(new Date(), 10)),
    createdAt: formatISO(subDays(new Date(), 5)),
    status: 'In Progress',
  },
];

let jobProcesses: JobProcess[] = [
  // Job 1
  { id: 'jp-1-1', jobId: 'A2511', processId: 'proc-1', assignedTo: 'user-2', status: 'In Progress', startTime: formatISO(subDays(new Date(), 5)), endTime: null, remarks: 'Initial design approved.' },
  ...processes.slice(1).map(p => ({ id: `jp-1-${p.sequenceNumber}`, jobId: 'A2511', processId: p.processId, assignedTo: null, status: 'Pending' as JobProcessStatus, startTime: null, endTime: null, remarks: null })),
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
export const addJob = async (jobData: Omit<Job, 'createdAt' | 'status'>): Promise<Job> => {
  const newJob: Job = {
    ...jobData,
    createdAt: new Date().toISOString(),
    status: 'In Progress',
  };
  jobs.unshift(newJob); // Add to the beginning
  return Promise.resolve(newJob);
};

export const addJobProcesses = async (processesData: JobProcess[]): Promise<void> => {
    jobProcesses.push(...processesData);
    return Promise.resolve();
};
