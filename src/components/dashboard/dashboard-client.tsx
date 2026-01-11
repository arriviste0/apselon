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
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const isEmployee = currentUser.role === 'employee';

  const handleJobCreated = (newJob: JobWithProcesses) => {
    setJobs((prevJobs) => [newJob, ...prevJobs]);
    router.refresh();
  };

  const handleJobUpdated = (updatedJob: JobWithProcesses) => {
    setJobs((prevJobs) => prevJobs.map(j => j.jobId === updatedJob.jobId ? updatedJob : j));
  };
  
  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;

    const job = jobs.find(
      (j) => j.jobId === jobToDelete || (j.refNo && j.refNo === jobToDelete)
    );
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

  const jobsForUser = React.useMemo(() => {
    if (!isEmployee) return jobs;
    const processById = new Map(processes.map((process) => [process.processId, process]));

    return jobs.filter((job) =>
      job.processes.some((jobProcess) => {
        if (jobProcess.assignedTo === currentUser.id) return true;
        if (jobProcess.assignedTo === null) {
          const processDef = processById.get(jobProcess.processId);
          return processDef?.processName === currentUser.department;
        }
        return false;
      })
    );
  }, [isEmployee, jobs, processes, currentUser.id, currentUser.department]);

  const filteredJobs = jobsForUser
    .filter((job) => {
      if (statusFilter === 'All') return true;
      return job.status === statusFilter;
    })
    .filter((job) =>
      job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const dedupedJobs = React.useMemo(() => {
    const seen = new Set<string>();
    return filteredJobs.filter((job) => {
      const key = `${job.jobId}-${job.createdAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredJobs]);

  return (
    <>
      <div className="space-y-6">
        <StatsCards jobs={jobsForUser} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">All Jobs</h1>
            <p className="text-sm text-muted-foreground">Track progress and manage production flow.</p>
          </div>
          {!isEmployee && (
            <CreateJobDialog
              users={users}
              processes={processes}
              onJobCreated={handleJobCreated}
              onJobUpdated={handleJobUpdated}
              jobToEdit={jobToEdit}
              isOpen={isCreateDialogOpen}
              onOpenChange={handleCloseDialog}
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by ID, customer..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as JobStatus | 'All')}>
              <TabsList className="w-full flex-wrap justify-start gap-1 lg:w-auto">
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="In Progress">In Progress</TabsTrigger>
                <TabsTrigger value="Overdue">Overdue</TabsTrigger>
                <TabsTrigger value="Completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Job ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="w-[150px] hidden md:table-cell">Priority</TableHead>
                  <TableHead className="w-[150px] hidden lg:table-cell">Due Date</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dedupedJobs.length > 0 ? (
                  dedupedJobs.map((job) => {
                    const visibleProcesses = isEmployee
                      ? processes.filter((processDef) =>
                          job.processes.some((jobProcess) => {
                            if (jobProcess.processId !== processDef.processId) return false;
                            if (jobProcess.assignedTo === currentUser.id) return true;
                            if (jobProcess.assignedTo === null) {
                              return processDef.processName === currentUser.department;
                            }
                            return false;
                          })
                        )
                      : processes;

                    return (
                      <JobListItem 
                        key={`${job.jobId}-${job.createdAt}`} 
                        job={job} 
                        processes={processes} 
                        visibleProcesses={visibleProcesses}
                        canManageJobs={!isEmployee}
                        onEdit={handleEdit}
                        onDelete={setJobToDelete}
                      />
                    );
                  })
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
