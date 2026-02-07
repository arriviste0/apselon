'use client';

import * as React from 'react';
import { Job, JobProcess, Process, User } from '@/lib/types';
import { JobTimeline } from './job-timeline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, differenceInBusinessDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TravellerCardInfo } from './traveller-card-info';
import { useUser } from '@/components/user/user-provider';

interface JobDetailsClientProps {
  job: Job;
  initialProcesses: JobProcess[];
  allProcesses: Process[];
  users: User[];
  currentUser: User;
}

export default function JobDetailsClient({
  job,
  initialProcesses,
  allProcesses,
  users,
  currentUser,
}: JobDetailsClientProps) {
  const { user: activeUser } = useUser();
  const displayUser = activeUser ?? currentUser;
  const jobKey = (job.refNo && job.refNo.trim() ? job.refNo : job.jobId).toLowerCase();
  const [jobProcesses, setJobProcesses] = React.useState(initialProcesses);

    const handleProcessUpdate = (update: JobProcess | JobProcess[]) => {
      if (Array.isArray(update)) {
        setJobProcesses(update);
        return;
      }
      
      const updatedProcess = update;
      setJobProcesses(prevProcesses => {
          const newProcesses = prevProcesses.map(p => p.id === updatedProcess.id ? updatedProcess : p);
          // If a process was completed, start the next one
          if(updatedProcess.status === 'Completed') {
              const updatedProcessDetails = allProcesses.find(p => p.processId === updatedProcess.processId);
              if (updatedProcessDetails) {
                  const nextProcessDetails = allProcesses.find(p => p.sequenceNumber === updatedProcessDetails.sequenceNumber + 1);
                  if (nextProcessDetails) {
                      const nextJobProcessIndex = newProcesses.findIndex(p => p.processId === nextProcessDetails.processId);
                      if (nextJobProcessIndex !== -1 && newProcesses[nextJobProcessIndex].status === 'Pending') {
                          newProcesses[nextJobProcessIndex] = {
                              ...newProcesses[nextJobProcessIndex],
                              status: 'In Progress',
                              startTime: new Date().toISOString(),
                              assignedTo: null,
                          };
                      }
                  }
              }
          }
          return newProcesses;
      });
  }

  const daysLeft = differenceInBusinessDays(parseISO(job.dueDate), new Date());

  const visibleProcesses = React.useMemo(() => {
    if (displayUser.role !== 'employee') return allProcesses;

    return allProcesses.filter((processDef) => {
      const jobProcess = jobProcesses.find((process) => process.processId === processDef.processId);
      if (!jobProcess) return false;
      return (
        processDef.processName === displayUser.department ||
        jobProcess.assignedTo === displayUser.id
      );
    });
  }, [allProcesses, jobProcesses, displayUser.department, displayUser.id, displayUser.role]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Job {job.jobId.toUpperCase()}</CardTitle>
              {displayUser.role === 'admin' ? (
                <CardDescription>{job.customerName} - {job.partNo}</CardDescription>
              ) : null}
            </div>
            <Badge variant={job.status === 'Overdue' ? 'destructive' : 'secondary'} className="text-sm">
              {job.status}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide">Issue Date</p>
              <p className="font-medium text-foreground">{format(parseISO(job.orderDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Delivery Date</p>
              <p className="font-medium text-foreground">{format(parseISO(job.dueDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Priority</p>
              <p className="font-medium text-foreground">{job.priority}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Days Left</p>
              <p className="font-medium text-foreground">{daysLeft}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="timeline">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Process Timeline</TabsTrigger>
          <TabsTrigger value="traveller-card">Traveller Card</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-6">
          <JobTimeline
            jobId={jobKey}
            job={job}
            jobProcesses={jobProcesses}
            allProcesses={allProcesses}
            displayProcesses={visibleProcesses}
            users={users}
            currentUser={displayUser}
            onProcessUpdate={handleProcessUpdate}
          />
        </TabsContent>
        <TabsContent value="traveller-card">
          <TravellerCardInfo job={job} isAdmin={displayUser.role === 'admin'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
