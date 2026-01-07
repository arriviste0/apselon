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
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListFilter, Search } from 'lucide-react';
import { JobListItem } from './job-list-item';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { deleteJobAction, restoreJobAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

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

  const [jobToEdit, setJobToEdit] = React.useState<JobWithProcesses | undefined>();
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [jobToDelete, setJobToDelete] = React.useState<string | null>(null);

  const { toast } = useToast();

  const handleJobCreated = (newJob: JobWithProcesses) => {
    setJobs((prevJobs) => [newJob, ...prevJobs]);
  };

  const handleJobUpdated = (updatedJob: JobWithProcesses) => {
    setJobs((prevJobs) => prevJobs.map(j => j.jobId === updatedJob.jobId ? updatedJob : j));
  };
  
  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;

    const job = jobs.find(j => j.jobId === jobToDelete);
    if (!job) return;

    // Optimistically remove the job from the UI
    setJobs(prev => prev.filter(j => j.jobId !== jobToDelete));
    setJobToDelete(null);

    try {
      const deletedJob = await deleteJobAction(jobToDelete);
      if (!deletedJob) throw new Error("Job not found on server");

      toast({
        title: 'Job Deleted',
        description: `${deletedJob.jobId.toUpperCase()} has been deleted.`,
        action: (
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await restoreJobAction(deletedJob);
                setJobs(prev => [...prev, deletedJob].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                toast({
                  title: 'Job Restored',
                  description: `${deletedJob.jobId.toUpperCase()} has been restored.`
                })
              } catch (e) {
                toast({
                  title: 'Error',
                  description: 'Failed to restore job.',
                  variant: 'destructive'
                });
                // If restore fails, we might need to refetch to get the true state
              }
            }}
          >
            Undo
          </Button>
        )
      });
    } catch (error) {
      // Revert optimistic update on failure
      setJobs(prev => [...prev, job].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      toast({
        title: 'Error',
        description: 'Failed to delete job.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (job: JobWithProcesses) => {
    setJobToEdit(job);
    setCreateDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setJobToEdit(undefined);
    }
    setCreateDialogOpen(open);
  }

  const filteredJobs = jobs
    .filter((job) => {
      if (statusFilter === 'All') return true;
      return job.status === statusFilter;
    })
    .filter((job) =>
      job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <>
      <div className="flex flex-col gap-6">
        <StatsCards jobs={jobs} />

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">All Jobs</h1>
          <CreateJobDialog
            users={users}
            processes={processes}
            onJobCreated={handleJobCreated}
            onJobUpdated={handleJobUpdated}
            jobToEdit={jobToEdit}
            isOpen={isCreateDialogOpen}
            onOpenChange={handleCloseDialog}
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
                    <JobListItem 
                      key={job.jobId} 
                      job={job} 
                      processes={processes} 
                      onEdit={handleEdit}
                      onDelete={setJobToDelete}
                    />
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
      <AlertDialog open={!!jobToDelete} onOpenChange={() => setJobToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the job
                and all of its associated process data.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90"
            >
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
