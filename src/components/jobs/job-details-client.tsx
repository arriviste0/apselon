'use client';

import * as React from 'react';
import { Job, JobProcess, Process, User } from '@/lib/types';
import { JobTimeline } from './job-timeline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, differenceInBusinessDays } from 'date-fns';

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
    const [jobProcesses, setJobProcesses] = React.useState(initialProcesses);

    const handleProcessUpdate = (updatedProcess: JobProcess) => {
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
                                assignedTo: currentUser.id, // Or logic to assign to next department
                            };
                        }
                    }
                }
            }
            return newProcesses;
        });
    }

  const daysLeft = differenceInBusinessDays(parseISO(job.dueDate), new Date());

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{job.customerName} - Job {job.jobId.toUpperCase()}</CardTitle>
              <CardDescription>{job.description}</CardDescription>
            </div>
            <Badge variant={job.status === 'Overdue' ? 'destructive' : 'secondary'} className="text-sm">{job.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-medium">{job.quantity}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground">Priority</p>
                    <p className="font-medium">{job.priority}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{format(parseISO(job.dueDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Days Left</p>
                    <p className={`font-medium ${daysLeft < 0 ? 'text-destructive' : ''}`}>{daysLeft >= 0 ? `${daysLeft} days` : `Overdue by ${Math.abs(daysLeft)} days`}</p>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <JobTimeline 
        jobId={job.jobId}
        jobProcesses={jobProcesses} 
        allProcesses={allProcesses}
        users={users} 
        currentUser={currentUser}
        onProcessUpdate={handleProcessUpdate}
      />
    </div>
  );
}
