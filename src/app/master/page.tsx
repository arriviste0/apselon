import { getJobs } from '@/lib/data';
import MasterClient from '@/components/master/master-client';

export default async function MasterPage() {
  const jobs = await getJobs();

  return <MasterClient initialJobs={jobs} />;
}
