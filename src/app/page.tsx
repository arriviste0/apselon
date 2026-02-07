import { getJobs, getUsers, getProcesses, getJobProcesses } from '@/lib/data';
import DashboardClient from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const jobs = await getJobs();
  const users = await getUsers();
  const processes = await getProcesses();
  const jobProcesses = await getJobProcesses();

  // In a real app, you'd get the current user from session
  const currentUser = users.find(user => user.role === 'admin');

  if (!currentUser) {
    return <div>Could not find admin user.</div>;
  }

  const jobsWithProcesses = jobs.map(job => {
    const jobKey = (job.refNo && job.refNo.trim() ? job.refNo : job.jobId).toLowerCase();
    const relatedProcesses = jobProcesses.filter(
      jp => jp.jobId.toLowerCase() === jobKey
    );
    return { ...job, processes: relatedProcesses };
  });

  return (
    <DashboardClient
      initialJobs={jobsWithProcesses}
      users={users}
      processes={processes}
      currentUser={currentUser}
    />
  );
}
