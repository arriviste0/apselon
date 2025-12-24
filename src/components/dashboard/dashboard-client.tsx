'use client';

import * as React from 'react';
import { JobWithProcesses, User, Process, JobStatus } from '@/lib/types';
import { StatsCards } from './stats-cards';
import { CreateJobDialog } from '../jobs/create-job-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListFilter, Search } from 'lucide-react';
import { JobListItem } from './job-list-item';

interface DashboardClientProps {
  initialJobs: JobWithProcesses[];
  users: User[];
  processes: Process[];
  currentUser: User;
}

export default function DashboardClient({
  initialJobs,
  users,
  processes,
  currentUser,
}: DashboardClientProps) {
  const [jobs, setJobs] = React.useState<JobWithProcesses[]>(initialJobs);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<JobStatus | 'All'>('All');

  const handleJobCreated = (newJob: JobWithProcesses) => {
    setJobs((prevJobs) => [newJob, ...prevJobs]);
  };
  
  const filteredJobs = jobs
    .filter((job) => {
      if (statusFilter === 'All') return true;
      return job.status === statusFilter;
    })
    .filter((job) =>
      job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="flex flex-col gap-6">
      <StatsCards jobs={jobs} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">All Jobs</h1>
        <CreateJobDialog
          users={users}
          processes={processes}
          onJobCreated={handleJobCreated}
        />
      </div>

      <div>
        <div className="flex items-center gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by ID, customer..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as JobStatus | 'All')}>
            <TabsList>
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="In Progress">In Progress</TabsTrigger>
              <TabsTrigger value="Overdue">Overdue</TabsTrigger>
              <TabsTrigger value="Completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Job ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="w-[150px]">Priority</TableHead>
                <TableHead className="w-[150px]">Due Date</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <JobListItem key={job.jobId} job={job} processes={processes} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No jobs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
