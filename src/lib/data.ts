import 'server-only';
import type { Db } from 'mongodb';
import { addDays, subDays, formatISO } from 'date-fns';
import { Job, JobProcess, JobWithProcesses, Process, User } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { getMongoClient } from './mongodb';

const DB_NAME = process.env.MONGODB_DB_NAME || 'apselon';

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
    jobId: 'a2511',
    customerName: 'A03 ARVI(VISHAL BHAI)',
    description: 'Custom gear housing for new engine model. Requires high precision machining.',
    partNo: 'LL502_R3(LL_WT_503_REV_3)',
    quantity: 700,
    priority: 'High',
    poNo: 'WHATSAPP',
    orderDate: '2026-01-03',
    isRepeat: true,
    layerType: 'Double Layer (D/S)',
    leadTime: '5 DAY',
    refNo: '6',
    launchedPcbs: 768,
    launchedPanels: 32,
    launchedPcbSqm: 5.60,
    launchedPanelSqm: 6.20,
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
    material: 'FR4',
    copperWeight: 'H/H (18/18)',
    thickness: 1.60,
    source: 'Any',
    ink: 'Any',
    ulLogo: false,
    solderMask: 'GREEN',
    legendColour: 'WHITE',
    legendSide: 'BOTH',
    surfaceFinish: 'HASL',
    vGrooving: true,
    cutting: 'M-Cutting',
    mTraceSetup: 'SETUP',
    oneP: '1 P',
    setup: 'SETUP',
    sheetSizeWidth: 1040,
    sheetSizeHeight: 1240,
    sheetUtilization: 94,
    panelsInSheet: 11,
    supplyInfo: 'SUPPLAY IN 12 UPS(2MM ROUTTTING)',
    dueDate: formatISO(addDays(new Date(), 10)),
    createdAt: formatISO(subDays(new Date(), 5)),
    status: 'In Progress',
    testingRequired: 'Normal BBT',
    preparedBy: 'Ashutosh Vyas',
  },
];

type JobProcessStatus = 'Pending' | 'In Progress' | 'Completed' | 'Rejected';

let jobProcesses: JobProcess[] = [
  { id: 'jp-6-1', jobId: '6', processId: 'proc-1', assignedTo: 'user-2', status: 'In Progress', startTime: formatISO(subDays(new Date(), 5)), endTime: null, remarks: 'Initial design approved.', quantityIn: 32, quantityOut: null, launchedPanels: 32 },
  ...processes.slice(1).map(p => ({
    id: `jp-6-${p.sequenceNumber}`,
    jobId: '6',
    processId: p.processId,
    assignedTo: null,
    status: 'Pending' as JobProcessStatus,
    startTime: null,
    endTime: null,
    remarks: null,
    quantityIn: null,
    quantityOut: null,
    launchedPanels: null
  })),
];

const normalizeKey = (value: string) =>
  value.toLowerCase().replace(/\s+/g, '');

type JobRecord = Job & {
  jobKey: string;
  refKey?: string;
};

const toJobRecord = (jobData: Job): JobRecord => {
  const refNo = jobData.refNo?.trim();
  return {
    ...jobData,
    jobId: jobData.jobId.toLowerCase(),
    refNo: refNo ? refNo : undefined,
    jobKey: normalizeKey(jobData.jobId),
    refKey: refNo ? normalizeKey(refNo) : undefined,
  };
};

const getDb = async (): Promise<Db | null> => {
  const clientPromise = getMongoClient();
  if (!clientPromise) return null;
  const client = await clientPromise;
  return client.db(DB_NAME);
};

let seeded = false;
let seedPromise: Promise<void> | null = null;
const ensureSeeded = async (db: Db) => {
  if (seeded) return;
  if (!seedPromise) {
    seedPromise = (async () => {
      const [usersCount, processesCount, jobsCount, jobProcessesCount] = await Promise.all([
        db.collection<User>('users').estimatedDocumentCount(),
        db.collection<Process>('processes').estimatedDocumentCount(),
        db.collection<Job>('jobs').estimatedDocumentCount(),
        db.collection<JobProcess>('jobProcesses').estimatedDocumentCount(),
      ]);

      if (usersCount === 0 && processesCount === 0 && jobsCount === 0 && jobProcessesCount === 0) {
        await db.collection<User>('users').insertMany(users.map(user => ({ ...user })));
        await db.collection<Process>('processes').insertMany(processes.map(process => ({ ...process })));
        const jobRecords = jobs.map((job) => toJobRecord(job));
        await db.collection<JobRecord>('jobs').insertMany(jobRecords);
        await db.collection<JobProcess>('jobProcesses').insertMany(jobProcesses.map(process => ({ ...process })));
      }
      seeded = true;
    })();
  }

  await seedPromise;
};

const getCollection = async <T>(name: string) => {
  const db = await getDb();
  if (!db) return null;
  await ensureSeeded(db);
  return db.collection<T>(name);
};

export const getUsers = async (): Promise<User[]> => {
  const collection = await getCollection<User>('users');
  if (!collection) return users;
  return collection.find({}, { projection: { _id: 0 } }).toArray();
};

export const getJobs = async (): Promise<Job[]> => {
  const collection = await getCollection<Job>('jobs');
  if (!collection) return jobs;
  return collection.find({}, { projection: { _id: 0, jobKey: 0, refKey: 0 } }).toArray();
};

export const getJobById = async (id: string): Promise<Job | undefined> => {
  const rawId = id.trim();
  const normalized = normalizeKey(rawId);
  const collection = await getCollection<Job>('jobs');
  if (!collection) {
    return jobs.find((j) => {
      const jobIdKey = normalizeKey(j.jobId);
      const refKey = normalizeKey(j.refNo ?? '');
      return jobIdKey === normalized || (refKey && refKey === normalized);
    });
  }

  const job = await collection.findOne(
    {
      $or: [
        { jobKey: normalized },
        { refKey: normalized },
        { jobId: rawId.toLowerCase() },
        { refNo: rawId },
      ],
    },
    { projection: { _id: 0, jobKey: 0, refKey: 0 } }
  );

  return job ?? undefined;
};

export const getProcesses = async (): Promise<Process[]> => {
  const collection = await getCollection<Process>('processes');
  if (!collection) return processes;
  return collection.find({}, { projection: { _id: 0 } }).toArray();
};

export const getJobProcesses = async (): Promise<JobProcess[]> => {
  const collection = await getCollection<JobProcess>('jobProcesses');
  if (!collection) return jobProcesses;
  return collection.find({}, { projection: { _id: 0 } }).toArray();
};

export const getJobProcessesByJobId = async (jobId: string): Promise<JobProcess[]> => {
  const normalized = jobId.toLowerCase();
  const collection = await getCollection<JobProcess>('jobProcesses');
  if (!collection) return jobProcesses.filter(jp => jp.jobId.toLowerCase() === normalized);
  return collection.find({ jobId: normalized }, { projection: { _id: 0 } }).toArray();
};

export const addJob = async (jobData: Job): Promise<Job> => {
  const refNo = jobData.refNo?.trim();
  const newJob: Job = {
    ...jobData,
    jobId: jobData.jobId.toLowerCase(),
    refNo: refNo ? refNo : undefined,
    createdAt: new Date().toISOString(),
    status: 'In Progress',
  };

  const collection = await getCollection<Job>('jobs');
  if (!collection) {
    jobs.unshift(newJob);
    return newJob;
  }

  const jobRecord = toJobRecord(newJob);
  await collection.insertOne(jobRecord);
  return newJob;
};

export const updateJob = async (jobData: Job): Promise<Job> => {
  const normalizedRefInput = jobData.refNo?.trim();
  const normalizedJob: Job = {
    ...jobData,
    refNo: normalizedRefInput ? normalizedRefInput : undefined,
  };
  const normalizedId = jobData.jobId.toLowerCase();
  const normalizedKey = normalizeKey(jobData.jobId);
  const normalizedRef = normalizedRefInput ? normalizeKey(normalizedRefInput) : '';

  const collection = await getCollection<Job>('jobs');
  if (!collection) {
    const jobIndex = jobs.findIndex(
      (j) =>
        j.jobId.toLowerCase() === normalizedId ||
        (normalizedRef && (j.refNo ?? '').toLowerCase() === normalizedRef)
    );
    if (jobIndex > -1) {
      jobs[jobIndex] = normalizedJob;
      return normalizedJob;
    }
    throw new Error('Job not found');
  }

  const existing = await collection.findOne({
    $or: [
      { jobKey: normalizedKey },
      { jobId: normalizedId },
      ...(normalizedRefInput ? [{ refKey: normalizedRef }, { refNo: normalizedRefInput }] : []),
    ],
  });
  if (!existing) throw new Error('Job not found');

  const jobRecord = toJobRecord(normalizedJob);
  await collection.updateOne(
    { _id: (existing as { _id: unknown })._id },
    { $set: jobRecord }
  );
  return normalizedJob;
};

export const deleteJob = async (jobId: string): Promise<JobWithProcesses | null> => {
  const rawId = jobId.trim();
  const normalized = rawId.toLowerCase();
  const collection = await getCollection<Job>('jobs');
  const processCollection = await getCollection<JobProcess>('jobProcesses');

  if (!collection || !processCollection) {
    const jobIndex = jobs.findIndex(
      (j) =>
        j.jobId.toLowerCase() === normalized ||
        ((j.refNo ?? '').toLowerCase() === normalized && (j.refNo ?? '').trim().length > 0)
    );
    if (jobIndex > -1) {
      const jobToDelete = jobs[jobIndex];
      const processKey = (jobToDelete.refNo && jobToDelete.refNo.trim() ? jobToDelete.refNo : jobToDelete.jobId).toLowerCase();
      const processesToDelete = jobProcesses.filter(
        (jp) => jp.jobId.toLowerCase() === processKey
      );

      const deletedJob: JobWithProcesses = { ...jobToDelete, processes: processesToDelete };

      jobs.splice(jobIndex, 1);
      jobProcesses = jobProcesses.filter(jp => jp.jobId.toLowerCase() !== processKey);

      return deletedJob;
    }
    return null;
  }

  const jobToDelete = await collection.findOne(
    {
      $or: [
        { jobKey: normalizeKey(rawId) },
        { refKey: normalizeKey(rawId) },
        { jobId: normalized },
        { refNo: rawId },
      ],
    },
    { projection: { _id: 0, jobKey: 0, refKey: 0 } }
  );

  if (!jobToDelete) return null;
  const processKey = (jobToDelete.refNo && jobToDelete.refNo.trim() ? jobToDelete.refNo : jobToDelete.jobId).toLowerCase();
  const processesToDelete = await processCollection.find({ jobId: processKey }, { projection: { _id: 0 } }).toArray();

  await collection.deleteMany({
    $or: [
      { jobKey: normalizeKey(rawId) },
      { refKey: normalizeKey(rawId) },
      { jobId: normalized },
      { refNo: rawId },
    ],
  });
  await processCollection.deleteMany({ jobId: processKey });

  return { ...jobToDelete, processes: processesToDelete };
};

export const restoreJob = async (jobData: JobWithProcesses): Promise<void> => {
  const rawRef = jobData.refNo?.trim() ?? '';
  const normalizedRef = rawRef.toLowerCase();
  const collection = await getCollection<Job>('jobs');
  const processCollection = await getCollection<JobProcess>('jobProcesses');

  if (!collection || !processCollection) {
    if (
      jobs.some(
        (j) =>
          j.jobId === jobData.jobId ||
          (normalizedRef && (j.refNo ?? '').toLowerCase() === normalizedRef)
      )
    ) {
      return;
    }
    const { processes: restoredProcesses, ...job } = jobData;
    jobs.unshift(job);
    jobProcesses.push(...restoredProcesses);
    return;
  }

  const existing = await collection.findOne({
    $or: [
      { jobKey: normalizeKey(jobData.jobId) },
      { jobId: jobData.jobId.toLowerCase() },
      ...(rawRef ? [{ refKey: normalizeKey(rawRef) }, { refNo: rawRef }] : []),
    ],
  });
  if (existing) return;

  const { processes: restoredProcesses, ...job } = jobData;
  const jobRecord = toJobRecord(job);
  await collection.insertOne(jobRecord);
  if (restoredProcesses.length > 0) {
    await processCollection.insertMany(restoredProcesses);
  }
};

export const addJobProcesses = async (processesData: JobProcess[]): Promise<void> => {
  const collection = await getCollection<JobProcess>('jobProcesses');
  if (!collection) {
    jobProcesses.push(...processesData);
    return;
  }
  if (processesData.length > 0) {
    const payload = processesData.map((process) => ({ ...process }));
    await collection.insertMany(payload);
  }
};

interface UpdateProcessData {
  newStatus: JobProcessStatus;
  remarks?: string;
  userId: string;
  quantityIn?: number;
  quantityOut?: number;
  reworkQuantityIn?: number;
  reworkQuantityOut?: number;
}

export const updateJobProcess = async (jobId: string, processId: string, data: UpdateProcessData): Promise<JobProcess> => {
  const normalizedJobId = jobId.toLowerCase();
  const processCollection = await getCollection<JobProcess>('jobProcesses');
  const processDefCollection = await getCollection<Process>('processes');

  if (!processCollection || !processDefCollection) {
    const processIndex = jobProcesses.findIndex(p => p.jobId === normalizedJobId && p.processId === processId);
    if (processIndex === -1) {
      throw new Error('Process not found');
    }

    const currentProcess = jobProcesses[processIndex];
    const processDef = processes.find(p => p.processId === processId);
    const preMaskDef = processes.find(p => p.processName === 'Pre-Mask Q.C.');
    const allowRework = !preMaskDef || (processDef ? processDef.sequenceNumber < preMaskDef.sequenceNumber : true);
    const isRework = allowRework && (data.reworkQuantityIn !== undefined || data.reworkQuantityOut !== undefined);

    let updatedProcess: JobProcess;

    if (isRework) {
      const newReworkIn = (currentProcess.reworkQuantityIn || 0) + (data.reworkQuantityIn || 0);
      const newReworkOut = (currentProcess.reworkQuantityOut || 0) + (data.reworkQuantityOut || 0);

      updatedProcess = {
        ...currentProcess,
        remarks: data.remarks || currentProcess.remarks,
        reworkQuantityIn: newReworkIn,
        reworkQuantityOut: newReworkOut,
      };

      const pending = (currentProcess.quantityIn || 0) - (updatedProcess.quantityOut || 0);
      if (pending === 0) {
        updatedProcess.status = 'Completed';
        updatedProcess.endTime = new Date().toISOString();
      }
    } else {
      updatedProcess = {
        ...currentProcess,
        status: data.newStatus,
        endTime: data.newStatus !== 'In Progress' ? new Date().toISOString() : currentProcess.endTime,
        startTime: data.newStatus === 'In Progress' && !currentProcess.startTime ? new Date().toISOString() : currentProcess.startTime,
        remarks: data.remarks || currentProcess.remarks,
        assignedTo: data.userId,
      };
      if (data.quantityIn !== undefined) updatedProcess.quantityIn = data.quantityIn;
      if (data.quantityOut !== undefined) updatedProcess.quantityOut = data.quantityOut;
    }

    if (!allowRework && updatedProcess.quantityIn !== null && updatedProcess.quantityIn !== undefined) {
      const diff = (updatedProcess.quantityIn || 0) - (updatedProcess.quantityOut || 0);
      updatedProcess.rejectQuantity = diff > 0 ? diff : 0;
    }

    jobProcesses[processIndex] = updatedProcess;

    if (updatedProcess.status === 'Completed') {
      if (processDef) {
        const nextProcessDef = processes.find(p => p.sequenceNumber === processDef.sequenceNumber + 1);
        if (nextProcessDef) {
          const nextProcessIndex = jobProcesses.findIndex(p => p.jobId === jobId && p.processId === nextProcessDef.processId);
          if (nextProcessIndex > -1 && jobProcesses[nextProcessIndex].status === 'Pending') {
            const totalOut = (updatedProcess.quantityOut || 0) + (updatedProcess.reworkQuantityOut || 0);
            jobProcesses[nextProcessIndex] = {
              ...jobProcesses[nextProcessIndex],
              status: 'In Progress',
              startTime: new Date().toISOString(),
              assignedTo: null,
              quantityIn: totalOut || updatedProcess.quantityOut || updatedProcess.reworkQuantityOut || null,
            };
          }
        }
      }
    }

    return updatedProcess;
  }

  const currentProcess = await processCollection.findOne(
    { jobId: normalizedJobId, processId },
    { projection: { _id: 0 } }
  );
  if (!currentProcess) throw new Error('Process not found');

  const processDefs = await processDefCollection.find({}, { projection: { _id: 0 } }).toArray();
  const processDef = processDefs.find(p => p.processId === processId);
  const preMaskDef = processDefs.find(p => p.processName === 'Pre-Mask Q.C.');
  const allowRework = !preMaskDef || (processDef ? processDef.sequenceNumber < preMaskDef.sequenceNumber : true);
  const isRework = allowRework && (data.reworkQuantityIn !== undefined || data.reworkQuantityOut !== undefined);

  let updatedProcess: JobProcess;

  if (isRework) {
    const newReworkIn = (currentProcess.reworkQuantityIn || 0) + (data.reworkQuantityIn || 0);
    const newReworkOut = (currentProcess.reworkQuantityOut || 0) + (data.reworkQuantityOut || 0);

    updatedProcess = {
      ...currentProcess,
      remarks: data.remarks || currentProcess.remarks,
      reworkQuantityIn: newReworkIn,
      reworkQuantityOut: newReworkOut,
    };

    const pending = (currentProcess.quantityIn || 0) - (updatedProcess.quantityOut || 0);
    if (pending === 0) {
      updatedProcess.status = 'Completed';
      updatedProcess.endTime = new Date().toISOString();
    }
  } else {
    updatedProcess = {
      ...currentProcess,
      status: data.newStatus,
      endTime: data.newStatus !== 'In Progress' ? new Date().toISOString() : currentProcess.endTime,
      startTime: data.newStatus === 'In Progress' && !currentProcess.startTime ? new Date().toISOString() : currentProcess.startTime,
      remarks: data.remarks || currentProcess.remarks,
      assignedTo: data.userId,
    };
    if (data.quantityIn !== undefined) updatedProcess.quantityIn = data.quantityIn;
    if (data.quantityOut !== undefined) updatedProcess.quantityOut = data.quantityOut;
  }

  if (!allowRework && updatedProcess.quantityIn !== null && updatedProcess.quantityIn !== undefined) {
    const diff = (updatedProcess.quantityIn || 0) - (updatedProcess.quantityOut || 0);
    updatedProcess.rejectQuantity = diff > 0 ? diff : 0;
  }

  await processCollection.updateOne(
    { jobId: normalizedJobId, processId },
    { $set: updatedProcess }
  );

  if (updatedProcess.status === 'Completed' && processDef) {
    const nextProcessDef = processDefs.find(p => p.sequenceNumber === processDef.sequenceNumber + 1);
    if (nextProcessDef) {
      const nextProcess = await processCollection.findOne(
        { jobId: normalizedJobId, processId: nextProcessDef.processId },
        { projection: { _id: 0 } }
      );
      if (nextProcess && nextProcess.status === 'Pending') {
        const totalOut = (updatedProcess.quantityOut || 0) + (updatedProcess.reworkQuantityOut || 0);
        await processCollection.updateOne(
          { jobId: normalizedJobId, processId: nextProcessDef.processId },
          {
            $set: {
              ...nextProcess,
              status: 'In Progress',
              startTime: new Date().toISOString(),
              assignedTo: null,
              quantityIn: totalOut || updatedProcess.quantityOut || updatedProcess.reworkQuantityOut || null,
            },
          }
        );
      }
    }
  }

  return updatedProcess;
};
