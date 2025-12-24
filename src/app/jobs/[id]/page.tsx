import { getJobById, getUsers, getJobProcessesByJobId, getProcesses } from '@/lib/data';
import JobDetailsClient from '@/components/jobs/job-details-client';
import { notFound } from 'next/navigation';

export default async function JobDetailsPage({ params }: { params: { id: string } }) {
  const job = await getJobById(params.id);
  
  if (!job) {
    notFound();
  }

  const allProcesses = await getProcesses();
  const jobProcesses = await getJobProcessesByJobId(params.id);
  const users = await getUsers();
  
  // In a real app, you'd get the current user from session
  const currentUser = users[1]; // Simulate being Alice (Design)

  return (
    <JobDetailsClient 
        job={job} 
        initialProcesses={jobProcesses} 
        allProcesses={allProcesses}
        users={users} 
        currentUser={currentUser} 
    />
  );
}
