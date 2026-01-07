'use client';

import * as React from 'react';
import { JobProcess, Process, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { CheckCircle, Circle, Clock, XCircle, Play, MoreVertical } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { updateProcessStatusAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '../ui/label';


interface JobTimelineProps {
  jobId: string;
  jobProcesses: JobProcess[];
  allProcesses: Process[];
  users: User[];
  currentUser: User;
  onProcessUpdate: (updatedProcess: JobProcess | JobProcess[]) => void;
}

const statusIcons = {
  Completed: <CheckCircle className="h-5 w-5 text-green-500" />,
  'In Progress': <Clock className="h-5 w-5 text-blue-500 animate-pulse" />,
  Rejected: <XCircle className="h-5 w-5 text-destructive" />,
  Pending: <Circle className="h-5 w-5 text-muted-foreground" />,
};

const statusColors = {
    Completed: 'border-green-500',
    'In Progress': 'border-blue-500',
    Rejected: 'border-destructive',
    Pending: 'border-muted',
}

export function JobTimeline({ jobId, jobProcesses, allProcesses, users, currentUser, onProcessUpdate }: JobTimelineProps) {
  const { toast } = useToast();
  const [remarks, setRemarks] = React.useState<Record<string, string>>({});
  
  const handleUpdateStatus = async (process: JobProcess, newStatus: 'Completed' | 'Rejected' | 'In Progress') => {
    const remark = remarks[process.id] || '';
    
    // Store previous state for undo
    const previousProcessState = process;
    const previousProcessesState = jobProcesses;

    // Optimistic update
    const updatedProcess = {
        ...process,
        status: newStatus,
        endTime: ['Completed', 'Rejected'].includes(newStatus) ? new Date().toISOString() : null,
        startTime: newStatus === 'In Progress' && !process.startTime ? new Date().toISOString() : process.startTime,
        remarks: remark || process.remarks
    };
    onProcessUpdate(updatedProcess);

    try {
        await updateProcessStatusAction({
            jobId: jobId,
            processId: process.processId,
            newStatus,
            remarks: remark,
            userId: currentUser.id,
        });

        toast({
            title: `Process ${newStatus}`,
            description: `${allProcesses.find(p => p.processId === process.processId)?.processName} marked as ${newStatus.toLowerCase()}.`,
            action: (
              <Button
                variant="ghost"
                onClick={() => {
                  onProcessUpdate(previousProcessesState);
                  toast({
                    title: 'Undo successful',
                    description: 'The process status has been reverted.',
                  });
                }}
              >
                Undo
              </Button>
            ),
        });
    } catch (error) {
        toast({
            title: 'Update failed',
            description: 'Could not update process status. Please try again.',
            variant: 'destructive',
        });
        // Revert optimistic update on failure
        onProcessUpdate(previousProcessState);
    }
  };


  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border -translate-x-1/2" />

      <div className="space-y-8">
        {allProcesses.map((processDef) => {
          const process = jobProcesses.find((p) => p.processId === processDef.processId);
          if (!process) return null;

          const assignedUser = users.find((u) => u.id === process.assignedTo);
          const canUpdate = process.assignedTo === currentUser.id || (process.status === 'Pending' && currentUser.department === processDef.processName);

          return (
            <div key={process.id} className="relative">
              <div className="absolute left-4 top-5 -translate-x-1/2 -translate-y-1/2 bg-background p-1 rounded-full">
                {statusIcons[process.status]}
              </div>
              <Card className={`ml-8 border-l-4 ${statusColors[process.status]}`}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{processDef.processName}</CardTitle>
                          <CardDescription>
                            Status: <span className="font-semibold">{process.status}</span>
                            {process.startTime && ` | Started: ${format(parseISO(process.startTime), 'PPp')}`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {assignedUser && (
                                <div className="flex items-center gap-2 text-sm">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={assignedUser.avatarUrl} data-ai-hint="person portrait" />
                                    <AvatarFallback>{assignedUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{assignedUser.name}</span>
                                </div>
                            )}
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>Assign User</DropdownMenuItem>
                                    <DropdownMenuItem>View History</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                {(process.remarks || canUpdate) && (
                    <CardContent>
                      {process.status === 'In Progress' && canUpdate ? (
                        <Textarea 
                            placeholder="Add remarks or issue notes..." 
                            value={remarks[process.id] || ''}
                            onChange={(e) => setRemarks(prev => ({...prev, [process.id]: e.target.value}))}
                        />
                      ) : process.remarks && (
                        <p className="text-sm text-muted-foreground border-l-2 pl-2">
                          <strong>Note:</strong> {process.remarks}
                        </p>
                      )}
                    </CardContent>
                )}
                {canUpdate && (
                  <CardFooter className="flex justify-end items-center gap-4">
                    {process.status === 'Pending' && (
                      <Button onClick={() => handleUpdateStatus(process, 'In Progress')}>
                        <Play className="mr-2 h-4 w-4" /> Start
                      </Button>
                    )}
                    {process.status === 'In Progress' && (
                      <>
                        <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(process, 'Rejected')}>
                          <XCircle className="mr-2 h-4 w-4" /> Issue / Reject
                        </Button>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id={`complete-${process.id}`}
                                onCheckedChange={(checked) => {
                                if (checked) {
                                    handleUpdateStatus(process, 'Completed');
                                }
                                }}
                                checked={process.status === 'Completed'}
                            />
                            <Label htmlFor={`complete-${process.id}`} className="font-semibold text-green-600">
                                Mark as Complete
                            </Label>
                        </div>
                      </>
                    )}
                  </CardFooter>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
