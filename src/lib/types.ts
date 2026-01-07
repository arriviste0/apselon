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
  description?: string;
  partNo: string;
  quantity: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  poNo: string;
  orderDate: string;
  isRepeat: boolean;
  layerType: string;
  leadTime?: string;
  refNo?: string;
  launchedPcbs?: number;
  launchedPanels?: number;
  launchedPcbSqm?: number;
  launchedPanelSqm?: number;
  pnlHole?: number;
  totalHole?: number;
  pcbSizeWidth?: number;
  pcbSizeHeight?: number;
  arraySizeWidth?: number;
  arraySizeHeight?: number;
  upsArrayWidth?: number;
  upsArrayHeight?: number;
  panelSizeWidth?: number;
  panelSizeHeight?: number;
  upsPanel?: number;
  material: string;
  copperWeight?: string;
  thickness?: number;
  source?: string;
  ink?: string;
  ulLogo: boolean;
  solderMask?: string;
  legendColour?: string;
  legendSide?: string;
  surfaceFinish?: string;
  vGrooving: boolean;
  cutting?: string;
  mTraceSetup?: string;
  oneP?: string;
  sheetSizeWidth?: number;
  sheetSizeHeight?: number;
  sheetUtilization?: number;
  panelsInSheet?: number;
  supplyInfo?: string;
  dueDate: string;
  createdAt: string;
  status: JobStatus;
  testingRequired?: string;
  preparedBy?: string;
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
  quantityIn?: number | null;
  quantityOut?: number | null;
  launchedPanels?: number | null;
}

export interface JobWithProcesses extends Job {
  processes: JobProcess[];
}
