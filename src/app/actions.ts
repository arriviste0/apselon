'use server';

import { revalidatePath } from 'next/cache';
import { addJob, addJobProcesses, getProcesses } from '@/lib/data';
import { JobWithProcesses, JobProcess } from '@/lib/types';

interface CreateJobData {
  customerName: string;
  description: string;
  quantity: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate: string;
}

export async function createJobAction(data: CreateJobData): Promise<JobWithProcesses> {
  const job = await addJob(data);
  const processes = await getProcesses();

  const jobProcesses: JobProcess[] = processes.map((p) => ({
    id: `jp-${job.jobId}-${p.processId}`,
    jobId: job.jobId,
    processId: p.processId,
    assignedTo: null,
    status: 'Pending',
    startTime: null,
    endTime: null,
    remarks: null,
  }));
  
  // Assign the first process
  jobProcesses[0].status = 'In Progress';
  jobProcesses[0].startTime = new Date().toISOString();


  await addJobProcesses(jobProcesses);
  
  revalidatePath('/');
  return { ...job, processes: jobProcesses };
}

interface UpdateProcessStatusData {
    jobId: string;
    processId: string;
    newStatus: 'Completed' | 'Rejected' | 'In Progress';
    remarks?: string;
    userId: string;
}

export async function updateProcessStatusAction(data: UpdateProcessStatusData) {
    // This is where you would update your database.
    // For this mock, we're not actually updating the state stored in memory
    // as it will be reset on next request. The client will optimistically update.
    console.log('Updating process status:', data);

    // In a real app you would do something like:
    // const jobProcess = await db.jobProcess.find(...)
    // await db.jobProcess.update(...)
    // if (data.newStatus === 'Completed') {
    //   const nextProcess = await db.jobProcess.find(...)
    //   if (nextProcess) await db.jobProcess.update({ where: { id: nextProcess.id }, data: { status: 'In Progress' }})
    // }
    
    revalidatePath(`/jobs/${data.jobId}`);
    revalidatePath('/');

    // We return the data so the client knows what was "saved".
    return data;
}
