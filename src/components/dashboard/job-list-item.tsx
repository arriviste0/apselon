'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  visibleProcesses?: Process[];
  canManageJobs?: boolean;
  showCustomer?: boolean;
  onEdit: (job: JobWithProcesses) => void;
  onDelete: (jobId: string) => void;
}

export function JobListItem({
  job,
  processes,
  visibleProcesses,
  canManageJobs = true,
  showCustomer = true,
  onEdit,
  onDelete,
}: JobListItemProps) {
  const router = useRouter();
  const jobRouteId = job.refNo && job.refNo.trim() ? job.refNo : job.jobId;
  const jobRouteParam = encodeURIComponent(jobRouteId);
  const processList = visibleProcesses ?? processes;
  const processIds = new Set(processList.map((process) => process.processId));
  const completedProcesses = job.processes.filter(
    (p) => processIds.has(p.processId) && p.status === 'Completed'
  ).length;
  const progressPercentage = processList.length > 0
    ? (completedProcesses / processList.length) * 100
    : 0;

  const currentProcess = processList.find(
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
      <TableCell className="font-medium whitespace-nowrap">
        <Link href={`/jobs/${jobRouteParam}`} className="hover:underline text-primary">
          {job.jobId.toUpperCase()}
        </Link>
      </TableCell>
      {showCustomer ? (
        <TableCell>
          <div className="flex flex-col">
            <span>{job.customerName}</span>
            <div className="text-xs text-muted-foreground md:hidden">
              <span className="mr-2">Priority: {job.priority}</span>
              <span>Due: {format(parseISO(job.dueDate), 'MMM dd, yyyy')}</span>
            </div>
          </div>
        </TableCell>
      ) : null}
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
      <TableCell className="hidden md:table-cell">
        <Badge variant={getPriorityBadgeVariant(job.priority)}>
          {job.priority}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap hidden lg:table-cell">{format(parseISO(job.dueDate), 'MMM dd, yyyy')}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => router.push(`/jobs/${jobRouteParam}`)}>
              View Details
            </DropdownMenuItem>
            {canManageJobs && (
              <DropdownMenuItem onClick={() => onEdit(job)}>
                Edit Job
              </DropdownMenuItem>
            )}
            {canManageJobs && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(jobRouteId)}
              >
                Delete Job
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
