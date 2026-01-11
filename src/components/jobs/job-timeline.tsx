'use client';

import * as React from 'react';
import { Job, JobProcess, Process, User } from '@/lib/types';
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
  job: Job;
  jobProcesses: JobProcess[];
  allProcesses: Process[];
  displayProcesses?: Process[];
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
  const quantityOut = process.quantityOut || 0;
  const reworkOut = process.reworkQuantityOut || 0;
  return process.quantityIn - quantityOut - reworkOut;
};

export function JobTimeline({ jobId, job, jobProcesses, allProcesses, displayProcesses, users, currentUser, onProcessUpdate }: JobTimelineProps) {
  const { toast } = useToast();
  const [remarks, setRemarks] = React.useState<Record<string, string>>({});
  const [updateInfo, setUpdateInfo] = React.useState<ProcessUpdateInfo | null>(null);
  const [historyProcess, setHistoryProcess] = React.useState<JobProcess | null>(null);
  const preMaskSequence = allProcesses.find(p => p.processName === 'Pre-Mask Q.C.')?.sequenceNumber ?? null;
  const processesToRender = displayProcesses ?? allProcesses;

  
  const handleUpdateStatus = async (
    process: JobProcess, 
    newStatus: 'Completed' | 'Rejected' | 'In Progress',
    quantityData: { launchedPanels?: number, quantityIn?: number, quantityOut?: number }
  ) => {
    
    // Store previous state for undo
    const previousProcessesState = [...jobProcesses];

    let updatedProcess: JobProcess;
    const processDef = allProcesses.find(p => p.processId === process.processId);
    const allowRework = preMaskSequence === null ? true : (processDef ? processDef.sequenceNumber < preMaskSequence : true);
    const isRework = allowRework && newStatus === 'In Progress' && process.status !== 'Pending';

    if (isRework) { // Rework action keeps original quantities intact
      const reworkQuantityIn = quantityData.quantityIn || 0;
      const reworkQuantityOut = quantityData.quantityOut || 0;
      const totalReworkIn = (process.reworkQuantityIn || 0) + reworkQuantityIn;
      const totalReworkOut = (process.reworkQuantityOut || 0) + reworkQuantityOut;

      updatedProcess = {
        ...process,
        remarks: remarks[process.id] || process.remarks,
        reworkQuantityIn: totalReworkIn,
        reworkQuantityOut: totalReworkOut,
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
      if (!allowRework && updatedProcess.quantityIn !== null && updatedProcess.quantityIn !== undefined) {
        const diff = (updatedProcess.quantityIn || 0) - (updatedProcess.quantityOut || 0);
        updatedProcess.rejectQuantity = diff > 0 ? diff : 0;
      }
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
          reworkQuantityIn: isRework ? quantityData.quantityIn : undefined,
          reworkQuantityOut: isRework ? quantityData.quantityOut : undefined,
          quantityIn: !isRework ? quantityData.quantityIn : undefined,
          quantityOut: !isRework ? quantityData.quantityOut : undefined,
        });

        // Intentionally suppress success toast to reduce noise in the UI.
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

    const allowRework = preMaskSequence === null ? true : processDef.sequenceNumber < preMaskSequence;
    const isRework = allowRework && newStatus === 'In Progress' && process.status !== 'Pending';
    const pendingQty = allowRework ? (process.status === 'Completed' ? 0 : calculatePending(process)) : null;
    const processesUsingPCBs = ['Pre-Mask Q.C.', 'BBT', 'Q.C', 'PACKING'];
    const currentUsesPcbs = processesUsingPCBs.includes(processDef.processName);

    const previousProcessesWithDef = jobProcesses
      .map(jp => ({ jp, pDef: allProcesses.find(p => p.processId === jp.processId)! }))
      .filter(({ pDef }) => pDef.sequenceNumber < processDef.sequenceNumber)
      .sort((a, b) => b.pDef.sequenceNumber - a.pDef.sequenceNumber);

    const previousProcessWithDef = currentUsesPcbs
      ? previousProcessesWithDef.find(({ jp }) => jp && jp.launchedPanels !== null)
      : previousProcessesWithDef.find(({ jp }) => jp && (jp.quantityOut !== null || jp.launchedPanels !== null));

    let lastQuantity = isRework ? (pendingQty ?? 0) : null;
    if (!isRework) {
      let baseQuantity: number | null = null;
      let baseUnit: 'pcbs' | 'panels' | null = null;

      const preferLaunchedPanels =
        currentUsesPcbs &&
        previousProcessWithDef?.jp.launchedPanels !== null &&
        previousProcessWithDef?.jp.launchedPanels !== undefined;

      const previousTotalOut =
        previousProcessWithDef?.jp.quantityOut !== null &&
        previousProcessWithDef?.jp.quantityOut !== undefined
          ? previousProcessWithDef.jp.quantityOut + (previousProcessWithDef?.jp.reworkQuantityOut ?? 0)
          : null;

      if (preferLaunchedPanels) {
        baseQuantity = previousProcessWithDef.jp.launchedPanels;
        baseUnit = 'panels';
      } else if (previousTotalOut !== null) {
        baseQuantity = previousTotalOut;
        baseUnit = processesUsingPCBs.includes(previousProcessWithDef.pDef.processName) ? 'pcbs' : 'panels';
      } else if (previousProcessWithDef?.jp.launchedPanels !== null && previousProcessWithDef?.jp.launchedPanels !== undefined) {
        baseQuantity = previousProcessWithDef.jp.launchedPanels;
        baseUnit = 'panels';
      } else if (process.quantityIn !== null && process.quantityIn !== undefined) {
        baseQuantity = process.quantityIn;
        baseUnit = currentUsesPcbs ? 'pcbs' : 'panels';
      }

      if (baseQuantity !== null && baseUnit !== null) {
        if ((baseUnit === 'pcbs') === currentUsesPcbs) {
          lastQuantity = baseQuantity;
        } else if (baseUnit === 'panels' && currentUsesPcbs) {
          lastQuantity = baseQuantity * (job.upsPanel ?? 1);
        } else if (baseUnit === 'pcbs' && !currentUsesPcbs) {
          const ups = job.upsPanel ?? 1;
          lastQuantity = ups ? baseQuantity / ups : baseQuantity;
        }
      }
    }
    const prefillQuantities = isRework ? { in: pendingQty ?? 0, out: 0 } : undefined;

    setUpdateInfo({ process, processDef, newStatus, lastQuantity, prefillQuantities, upsPanel: job.upsPanel });
  };
  
  return (
    <>
      <div className="relative pl-6 sm:pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 sm:left-4 top-4 bottom-4 w-0.5 bg-border -translate-x-1/2" />

        <div className="space-y-6 sm:space-y-8">
          {processesToRender.map((processDef) => {
            const process = jobProcesses.find((p) => p.processId === processDef.processId);
            if (!process) return null;

            const assignedUser = users.find((u) => u.id === process.assignedTo);
            const canUpdate =
              currentUser.role === 'admin' ||
              currentUser.department === processDef.processName ||
              process.assignedTo === currentUser.id;

            const allowRework = preMaskSequence === null ? true : processDef.sequenceNumber < preMaskSequence;
            const pendingQty = allowRework ? calculatePending(process) : null;
            const rejectQty = !allowRework && process.quantityIn !== null ? (process.rejectQuantity ?? null) : null;


            return (
              <div key={process.id} className="relative">
                <div className="absolute left-3 sm:left-4 top-5 -translate-x-1/2 -translate-y-1/2 bg-background p-1 rounded-full">
                  {statusIcons[process.status]}
                </div>
                <Card className={`ml-6 sm:ml-8 border-l-4 shadow-sm ${statusColors[process.status]}`}>
                  <CardHeader className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <CardTitle>{processDef.processName}</CardTitle>
                            <CardDescription>
                              Status: <span className="font-semibold">{process.status}</span>
                              {process.startTime && ` | Started: ${format(parseISO(process.startTime), 'PPp')}`}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
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

                      { (process.status !== 'Pending' && (process.quantityIn !== null || process.reworkQuantityIn !== null || process.rejectQuantity !== null)) && (
                        <div className='text-sm space-y-1 text-muted-foreground'>
                            {process.quantityIn !== null && <p>Original In: <span className='font-medium text-foreground'>{process.quantityIn}</span></p>}
                            {allowRework && (
                              <p>Rework In: <span className='font-medium text-foreground'>{process.reworkQuantityIn ?? 0}</span></p>
                            )}
                            {process.quantityOut !== null && (
                              <p>
                                Original Out:{' '}
                                <span className='font-medium text-foreground'>
                                  {process.quantityOut + (process.reworkQuantityOut ?? 0)}
                                </span>
                              </p>
                            )}
                            {allowRework && (
                              <p>Rework Out: <span className='font-medium text-foreground'>{process.reworkQuantityOut ?? 0}</span></p>
                            )}
                            {pendingQty !== null && <p>Pending: <span className={`font-medium ${pendingQty > 0 ? 'text-destructive' : 'text-foreground'}`}>{pendingQty}</span></p>}
                            {rejectQty !== null && rejectQty > 0 && <p>Reject Quantity: <span className="font-medium text-destructive">{rejectQty}</span></p>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex flex-col items-end gap-3 sm:flex-row sm:justify-end">
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateDialog(process, 'Completed')}
                            className="border-green-500 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark as Complete
                          </Button>
                        </>
                      )}
                     {allowRework && (process.status === 'Completed' || process.status === 'Rejected') && (pendingQty ?? 0) > 0 && (
                        <Button variant="outline" size="sm" onClick={() => openUpdateDialog(process, 'In Progress')}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Rework
                        </Button>
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
                <div>
                  <p className="text-sm font-medium">Reject Quantity</p>
                  <p>{historyProcess.rejectQuantity ?? 'N/A'}</p>
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
