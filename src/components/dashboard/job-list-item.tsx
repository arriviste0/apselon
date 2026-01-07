'use client';

import * as React from 'react';
import Link from 'next/link';
import { JobWithProcesses, Process } from '@/lib/types';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface JobListItemProps {
  job: JobWithProcesses;
  processes: Process[];
  onEdit: (job: JobWithProcesses) => void;
  onDelete: (jobId: string) => void;
}

export function JobListItem({ job, processes, onEdit, onDelete }: JobListItemProps) {
  const completedProcesses = job.processes.filter(
    (p) => p.status === 'Completed'
  ).length;
  const progressPercentage = (completedProcesses / processes.length) * 100;

  const currentProcess = processes.find(
    (p) => job.processes.find(jp => jp.processId === p.processId && jp.status === 'In Progress')
  );

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'High':
      case 'Urgent':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link href={`/jobs/${job.jobId}`} className="hover:underline text-primary">
          {job.jobId.toUpperCase()}
        </Link>
      </TableCell>
      <TableCell>{job.customerName}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {currentProcess?.processName || job.status}
            </span>
            <span className="text-xs font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getPriorityBadgeVariant(job.priority)}>
          {job.priority}
        </Badge>
      </TableCell>
      <TableCell>{format(parseISO(job.dueDate), 'MMM dd, yyyy')}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.jobId}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(job)}>
              Edit Job
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(job.jobId)}
            >
              Delete Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
