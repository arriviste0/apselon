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
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

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

  const processNameById = React.useMemo(() => {
    return new Map(processes.map((process) => [process.processId, process.processName]));
  }, [processes]);

  const getCurrentProcessName = React.useCallback(
    (job: JobWithProcesses) => {
      const current = job.processes.find((process) => process.status === 'In Progress');
      if (!current) return '-';
      return processNameById.get(current.processId) ?? '-';
    },
    [processNameById]
  );

  const filteredJobs = jobsForUser
    .filter((job) => {
      if (statusFilter === 'All') return true;
      return job.status === statusFilter;
    })
    .filter((job) => {
      const query = searchTerm.toLowerCase();
      if (!query) return true;
      if (job.jobId.toLowerCase().includes(query)) return true;
      if (job.description?.toLowerCase().includes(query)) return true;
      if (!isEmployee && job.customerName.toLowerCase().includes(query)) return true;
      return false;
    });

  const dedupedJobs = React.useMemo(() => {
    const seen = new Set<string>();
    return filteredJobs.filter((job) => {
      const key = `${job.jobId}-${job.createdAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredJobs]);

  const tableColCount = isEmployee ? 5 : 6;

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
                placeholder={isEmployee ? "Search jobs by ID..." : "Search jobs by ID, customer..."}
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
                  {!isEmployee ? <TableHead>Customer</TableHead> : null}
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
                        showCustomer={!isEmployee}
                        onEdit={handleEdit}
                        onDelete={setJobToDelete}
                      />
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={tableColCount} className="h-24 text-center">
                      No jobs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {!isEmployee && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Production Master</h2>
                <p className="text-sm text-muted-foreground">
                  Master list pulled directly from the job cards.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/master">View Full Master</Link>
              </Button>
            </div>
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job No</TableHead>
                      <TableHead className="hidden sm:table-cell">Ref. No</TableHead>
                      <TableHead>Part No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden md:table-cell">Issue Date</TableHead>
                      <TableHead className="hidden lg:table-cell">Delivery Date</TableHead>
                      <TableHead className="hidden md:table-cell">Current Process</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.length > 0 ? (
                      jobs.map((job) => {
                        const jobRouteId = job.refNo && job.refNo.trim() ? job.refNo : job.jobId;
                        return (
                          <TableRow key={`master-${job.jobId}-${job.createdAt}`}>
                            <TableCell className="font-medium">{job.jobId.toUpperCase()}</TableCell>
                            <TableCell className="hidden sm:table-cell">{job.refNo ?? '-'}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{job.partNo}</span>
                                <span className="text-xs text-muted-foreground sm:hidden">
                                  {job.customerName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{job.customerName}</TableCell>
                            <TableCell className="whitespace-nowrap hidden md:table-cell">
                              {format(parseISO(job.orderDate), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="whitespace-nowrap hidden lg:table-cell">
                              {format(parseISO(job.dueDate), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{getCurrentProcessName(job)}</TableCell>
                            <TableCell className="hidden sm:table-cell">{job.status}</TableCell>
                            <TableCell className="text-right">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/jobs/${encodeURIComponent(jobRouteId)}`}>
                                  View Job
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No jobs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
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
