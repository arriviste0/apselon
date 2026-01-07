'use client';

import * as React from 'react';
import { JobProcess, Process, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { CheckCircle, Circle, Clock, XCircle, Play, MoreVertical, Minus, Plus } from 'lucide-react';
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
import { ProcessUpdateDialog, type ProcessUpdateInfo } from './process-update-dialog';


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
  const [updateInfo, setUpdateInfo] = React.useState<ProcessUpdateInfo | null>(null);

  
  const handleUpdateStatus = async (
    process: JobProcess, 
    newStatus: 'Completed' | 'Rejected',
    quantityData: { launchedPanels?: number, quantityIn?: number, quantityOut?: number }
  ) => {
    
    // Store previous state for undo
    const previousProcessesState = [...jobProcesses];

    // Optimistic update
    const updatedProcess = {
        ...process,
        status: newStatus,
        endTime: new Date().toISOString(),
        remarks: remarks[process.id] || process.remarks,
        ...quantityData,
    };
    onProcessUpdate(updatedProcess);

    try {
        await updateProcessStatusAction({
            jobId: jobId,
            processId: process.processId,
            newStatus,
            remarks: remarks[process.id] || '',
            userId: currentUser.id,
            ...quantityData
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
        onProcessUpdate(previousProcessesState);
    } finally {
        setUpdateInfo(null);
        setRemarks(prev => ({...prev, [process.id]: ''}))
    }
  };

  const handleStartProcess = async (process: JobProcess) => {
    const previousProcessesState = [...jobProcesses];
    const updatedProcess = {
      ...process,
      status: 'In Progress' as const,
      startTime: new Date().toISOString(),
    };
    onProcessUpdate(updatedProcess);

    try {
      await updateProcessStatusAction({
        jobId,
        processId: process.processId,
        newStatus: 'In Progress',
        userId: currentUser.id,
      });
      toast({
        title: 'Process Started',
        description: `${allProcesses.find(p => p.processId === process.processId)?.processName} is now in progress.`
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Could not start process. Please try again.',
        variant: 'destructive'
      });
      onProcessUpdate(previousProcessesState);
    }
  }

  const openUpdateDialog = (process: JobProcess, newStatus: 'Completed' | 'Rejected') => {
    const processDef = allProcesses.find(p => p.processId === process.processId);
    if (!processDef) return;

    const previousProcess = allProcesses
      .filter(p => p.sequenceNumber < processDef.sequenceNumber)
      .sort((a,b) => b.sequenceNumber - a.sequenceNumber)
      .map(p => jobProcesses.find(jp => jp.processId === p.processId))
      .find(jp => jp && (jp.quantityOut !== null || jp.launchedPanels !== null));
      
    const lastQuantity = previousProcess?.quantityOut ?? previousProcess?.launchedPanels ?? process.quantityIn ?? null;

    setUpdateInfo({ process, processDef, newStatus, lastQuantity });
  };
  
  return (
    <>
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border -translate-x-1/2" />

        <div className="space-y-8">
          {allProcesses.map((processDef) => {
            const process = jobProcesses.find((p) => p.processId === processDef.processId);
            if (!process) return null;

            const assignedUser = users.find((u) => u.id === process.assignedTo);
            const canUpdate = process.assignedTo === currentUser.id || (process.status === 'Pending' && currentUser.department === processDef.processName);
            const pendingQty = (typeof process.quantityIn === 'number' && typeof process.quantityOut === 'number') 
              ? process.quantityIn - process.quantityOut
              : null;


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
                  
                  <CardContent>
                    <div className="space-y-4">
                      {(process.remarks || (process.status === 'In Progress' && canUpdate)) && (
                        <div>
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
                        </div>
                      )}

                      { (process.status === 'Completed' || process.status === 'Rejected') && (
                        <div className='text-sm space-y-1 text-muted-foreground'>
                            {process.quantityIn !== null && <p>Quantity In: <span className='font-medium text-foreground'>{process.quantityIn}</span></p>}
                            {process.quantityOut !== null && <p>Quantity Out: <span className='font-medium text-foreground'>{process.quantityOut}</span></p>}
                            {pendingQty !== null && <p>Pending: <span className={`font-medium ${pendingQty > 0 ? 'text-destructive' : 'text-foreground'}`}>{pendingQty}</span></p>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  {canUpdate && (
                    <CardFooter className="flex justify-end items-center gap-4">
                      {process.status === 'Pending' && (
                        <Button onClick={() => handleStartProcess(process)}>
                          <Play className="mr-2 h-4 w-4" /> Start
                        </Button>
                      )}
                      {process.status === 'In Progress' && (
                        <>
                          <Button variant="destructive" size="sm" onClick={() => openUpdateDialog(process, 'Rejected')}>
                            <XCircle className="mr-2 h-4 w-4" /> Issue / Reject
                          </Button>
                          <div className="flex items-center space-x-2">
                              <Checkbox
                                  id={`complete-${process.id}`}
                                  onCheckedChange={(checked) => {
                                  if (checked) {
                                      openUpdateDialog(process, 'Completed');
                                  }
                                  }}
                                  checked={false} // Should not remain checked
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
      <ProcessUpdateDialog 
        updateInfo={updateInfo} 
        onOpenChange={() => setUpdateInfo(null)}
        onSubmit={handleUpdateStatus}
        remarks={updateInfo ? (remarks[updateInfo.process.id] || '') : ''}
        onRemarksChange={(remark) => updateInfo && setRemarks(prev => ({...prev, [updateInfo.process.id]: remark}))}
      />
    </>
  );
}
