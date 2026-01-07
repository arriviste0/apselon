'use server';

import { revalidatePath } from 'next/cache';
import { addJob, addJobProcesses, getProcesses, deleteJob, updateJob, restoreJob, updateJobProcess } from '@/lib/data';
import { Job, JobWithProcesses, JobProcess } from '@/lib/types';

export async function createJobAction(data: Job): Promise<JobWithProcesses> {
  const job = await addJob(data);
  const processes = await getProcesses();

  const jobProcesses: JobProcess[] = processes.map((p, index) => ({
    id: `jp-${job.jobId}-${p.processId}`,
    jobId: job.jobId,
    processId: p.processId,
    assignedTo: null,
    status: index === 0 ? 'In Progress' : 'Pending',
    startTime: index === 0 ? new Date().toISOString() : null,
    endTime: null,
    remarks: null,
    quantityIn: index === 0 ? job.launchedPanels : null,
    quantityOut: null,
    launchedPanels: index === 0 ? job.launchedPanels : null,
  }));
  
  await addJobProcesses(jobProcesses);
  
  revalidatePath('/');
  revalidatePath('/master');
  return { ...job, processes: jobProcesses };
}

export async function updateJobAction(data: Job): Promise<Job> {
    const job = await updateJob(data);
    revalidatePath('/');
    revalidatePath(`/jobs/${job.jobId}`);
    revalidatePath('/master');
    return job;
}

export async function deleteJobAction(jobId: string): Promise<JobWithProcesses | null> {
    const deletedJob = await deleteJob(jobId);
    revalidatePath('/');
    revalidatePath('/master');
    return deletedJob;
}

export async function restoreJobAction(job: JobWithProcesses): Promise<void> {
    await restoreJob(job);
    revalidatePath('/');
    revalidatePath('/master');
}


interface UpdateProcessStatusData {
    jobId: string;
    processId: string;
    newStatus: 'Completed' | 'Rejected' | 'In Progress' | 'Pending';
    remarks?: string;
    userId: string;
    quantityIn?: number;
    quantityOut?: number;
    reworkQuantityIn?: number;
    reworkQuantityOut?: number;
}

export async function updateProcessStatusAction(data: UpdateProcessStatusData) {
    await updateJobProcess(data.jobId, data.processId, data);
    
    revalidatePath(`/jobs/${data.jobId}`);
    revalidatePath('/');

    // We return the data so the client knows what was "saved".
    return data;
}
