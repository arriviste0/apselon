import { notFound } from 'next/navigation';
import { getJobById, getJobProcessesByJobId, getProcesses, getUsers } from '@/lib/data';
import JobDetailsClient from '@/components/jobs/job-details-client';

export const dynamic = 'force-dynamic';

interface JobDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const { id } = await params;
  const normalizedId = decodeURIComponent(id).trim();
  const job = await getJobById(normalizedId);

  if (!job) {
    notFound();
  }

  const jobKey = (job.refNo && job.refNo.trim() ? job.refNo : job.jobId).toLowerCase();
  const [processes, jobProcesses, users] = await Promise.all([
    getProcesses(),
    getJobProcessesByJobId(jobKey),
    getUsers(),
  ]);

  const currentUser = users.find((u) => u.role === 'admin') ?? users[0];

  if (!currentUser) {
    notFound();
  }

  return (
    <JobDetailsClient
      job={job}
      initialProcesses={jobProcesses}
      allProcesses={processes}
      users={users}
      currentUser={currentUser}
    />
  );
}
