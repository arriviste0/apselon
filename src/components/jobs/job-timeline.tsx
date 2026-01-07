'use client';

import * as React from 'react';
import { JobProcess, Process, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { CheckCircle, Circle, Clock, XCircle, Play, MoreVertical, Minus, Plus, RefreshCw } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


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

const calculatePending = (process: JobProcess): number | null => {
  if (process.quantityIn == null) return null;
  return process.quantityIn - (process.quantityOut || 0) - (process.reworkQuantityOut || 0);
};

export function JobTimeline({ jobId, jobProcesses, allProcesses, users, currentUser, onProcessUpdate }: JobTimelineProps) {
  const { toast } = useToast();
  const [remarks, setRemarks] = React.useState<Record<string, string>>({});
  const [updateInfo, setUpdateInfo] = React.useState<ProcessUpdateInfo | null>(null);
  const [historyProcess, setHistoryProcess] = React.useState<JobProcess | null>(null);

  
  const handleUpdateStatus = async (
    process: JobProcess, 
    newStatus: 'Completed' | 'Rejected' | 'In Progress',
    quantityData: { launchedPanels?: number, quantityIn?: number, quantityOut?: number }
  ) => {
    
    // Store previous state for undo
    const previousProcessesState = [...jobProcesses];

    let updatedProcess: JobProcess;
    const isRework = newStatus === 'In Progress' && process.status !== 'Pending';

    if (isRework) { // This is a Rework action - remove rework fields and make original out and pending editable
      const reworkQuantityOut = (process.quantityIn || 0) - (quantityData.quantityOut || 0) - (quantityData.pending || 0);

      updatedProcess = {
        ...process,
        remarks: remarks[process.id] || process.remarks,
        quantityOut: quantityData.quantityOut,
        reworkQuantityIn: 0,
        reworkQuantityOut: reworkQuantityOut,
      };

      // If rework makes pending 0, mark as complete
      if (calculatePending(updatedProcess) === 0) {
          updatedProcess.status = 'Completed';
          updatedProcess.endTime = new Date().toISOString();
      }

    } else {
       updatedProcess = {
          ...process,
          status: newStatus,
          endTime: newStatus !== 'In Progress' ? new Date().toISOString() : null,
          remarks: remarks[process.id] || process.remarks,
          ...quantityData,
      };
    }

    onProcessUpdate(updatedProcess);

    try {
        await updateProcessStatusAction({
          jobId: jobId,
          processId: process.processId,
          newStatus: updatedProcess.status, // Use potentially updated status
          remarks: remarks[process.id] || '',
          userId: currentUser.id,
          // For rework we send updated fields, otherwise send normal quantities
          reworkQuantityIn: isRework ? 0 : undefined,
          reworkQuantityOut: isRework ? updatedProcess.reworkQuantityOut : undefined,
          quantityIn: !isRework ? quantityData.quantityIn : undefined,
          quantityOut: isRework ? quantityData.quantityOut : (!isRework ? quantityData.quantityOut : undefined),
        });

        toast({
            title: `Process Updated`,
            description: `${allProcesses.find(p => p.processId === process.processId)?.processName} has been updated.`,
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

  const openUpdateDialog = (process: JobProcess, newStatus: 'Completed' | 'Rejected' | 'In Progress') => {
    const processDef = allProcesses.find(p => p.processId === process.processId);
    if (!processDef) return;

    const isRework = newStatus === 'In Progress' && process.status !== 'Pending';
    const pendingQty = process.status === 'Completed' ? 0 : calculatePending(process);

    const previousProcessJob = jobProcesses
      .map(jp => ({ jp, pDef: allProcesses.find(p => p.processId === jp.processId)! }))
      .filter(({ pDef }) => pDef.sequenceNumber < processDef.sequenceNumber)
      .sort((a, b) => b.pDef.sequenceNumber - a.pDef.sequenceNumber)
      .map(({ jp }) => jp)
      .find(jp => jp && (jp.quantityOut !== null || jp.launchedPanels !== null));
      
    const lastQuantity = isRework ? (pendingQty ?? 0) : (previousProcessJob?.quantityOut ?? previousProcessJob?.launchedPanels ?? process.quantityIn ?? null);
    const prefillQuantities = isRework ? { originalOut: process.quantityOut ?? 0, pending: pendingQty ?? 0 } : undefined;

    setUpdateInfo({ process, processDef, newStatus, lastQuantity, prefillQuantities });
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

            const pendingQty = calculatePending(process);


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
                                      <DropdownMenuItem onClick={() => setHistoryProcess(process)}>View History</DropdownMenuItem>
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

                      { (process.status !== 'Pending' && (process.quantityIn !== null || process.reworkQuantityIn !== null)) && (
                        <div className='text-sm space-y-1 text-muted-foreground'>
                            {process.quantityIn !== null && <p>Original In: <span className='font-medium text-foreground'>{process.quantityIn}</span></p>}
                            {process.reworkQuantityIn !== null && <p>Rework In: <span className='font-medium text-foreground'>{process.reworkQuantityIn}</span></p>}
                            {process.quantityOut !== null && <p>Original Out: <span className='font-medium text-foreground'>{process.quantityOut}</span></p>}
                            {process.reworkQuantityOut !== null && <p>Rework Out: <span className='font-medium text-foreground'>{process.reworkQuantityOut}</span></p>}
                            {pendingQty !== null && <p>Pending: <span className={`font-medium ${pendingQty > 0 ? 'text-destructive' : 'text-foreground'}`}>{pendingQty}</span></p>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-end items-center gap-4">
                     {(pendingQty ?? 0) > 0 && (
                        <Button variant="outline" size="sm" onClick={() => openUpdateDialog(process, 'In Progress')}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Rework
                        </Button>
                     )}
                     {canUpdate && process.status === 'Pending' && (
                        <Button onClick={() => handleStartProcess(process)}>
                          <Play className="mr-2 h-4 w-4" /> Start
                        </Button>
                      )}
                      {canUpdate && process.status === 'In Progress' && (
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
      <Dialog open={!!historyProcess} onOpenChange={() => setHistoryProcess(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process History</DialogTitle>
            <DialogDescription>
              Details for {allProcesses.find(p => p.processId === historyProcess?.processId)?.processName}
            </DialogDescription>
          </DialogHeader>
          {historyProcess && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p>{historyProcess.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Assigned To</p>
                  <p>{users.find(u => u.id === historyProcess.assignedTo)?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Start Time</p>
                  <p>{historyProcess.startTime ? format(parseISO(historyProcess.startTime), 'PPp') : 'Not started'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">End Time</p>
                  <p>{historyProcess.endTime ? format(parseISO(historyProcess.endTime), 'PPp') : 'Not completed'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Quantity In</p>
                  <p>{historyProcess.quantityIn ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Quantity Out</p>
                  <p>{historyProcess.quantityOut ?? 'N/A'}</p>
                </div>
              </div>
              {historyProcess.remarks && (
                <div>
                  <p className="text-sm font-medium">Remarks</p>
                  <p className="text-sm text-muted-foreground">{historyProcess.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
