'use client';

import * as React from 'react';
import { Job } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

interface MasterClientProps {
  initialJobs: Job[];
}

export default function MasterClient({ initialJobs }: MasterClientProps) {
  const [jobs, setJobs] = React.useState<Job[]>(initialJobs);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    // In a real app with a proper database, you might want to refetch or subscribe to updates.
    // For this mock data setup, we can assume initialJobs is sufficient for the lifetime of the component
    // unless we implement a client-side mutation that adds jobs, which we do in the dashboard.
    // To keep this page in sync, we could use a global state or refetch on focus.
    // For simplicity, we'll just work with the initial data.
  }, []);

  const filteredJobs = jobs.filter(
    (job) =>
      job.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Job Master List</h1>

      <div className="flex items-center gap-4 py-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Job ID, Part No, or Customer Name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job No</TableHead>
              <TableHead>Part No</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <TableRow key={job.jobId}>
                  <TableCell className="font-medium">{job.jobId.toUpperCase()}</TableCell>
                  <TableCell>{job.partNo}</TableCell>
                  <TableCell>{job.customerName}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/jobs/${job.jobId}`}>
                            View Job
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No jobs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
