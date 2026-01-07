'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Job, JobProcess, Process, User } from '@/lib/types';
import { getJobById, getUsers, getJobProcessesByJobId, getProcesses } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO, differenceInBusinessDays } from 'date-fns';
import { CheckCircle, Circle, Clock, XCircle, Play, MoreVertical, Minus, Plus, RefreshCw } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { updateProcessStatusAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ProcessUpdateDialog, type ProcessUpdateInfo } from '@/components/jobs/process-update-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TravellerCardInfo } from '@/components/jobs/traveller-card-info';
import { Progress } from '@/components/ui/progress';

export default function JobDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [job, setJob] = React.useState<Job | null>(null);
  const [jobProcesses, setJobProcesses] = React.useState<JobProcess[]>([]);
  const [allProcesses, setAllProcesses] = React.useState<Process[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [remarks, setRemarks] = React.useState<Record<string, string>>({});
  const [updateInfo, setUpdateInfo] = React.useState<ProcessUpdateInfo | null>(null);
  const [historyProcess, setHistoryProcess] = React.useState<JobProcess | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobData, processesData, jobProcessesData, usersData] = await Promise.all([
          getJobById(id),
          getProcesses(),
          getJobProcessesByJobId(id),
          getUsers(),
        ]);

        if (!jobData) {
          // Handle not found
          return;
        }

        setJob(jobData);
        setAllProcesses(processesData);
        setJobProcesses(jobProcessesData);
        setUsers(usersData);
        setCurrentUser(usersData[1]); // Simulate current user
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleProcessUpdate = (update: JobProcess | JobProcess[]) => {
    if (Array.isArray(update)) {
      setJobProcesses(update);
      return;
    }

    const updatedProcess = update;
    setJobProcesses(prevProcesses => {
      const newProcesses = prevProcesses.map(p => p.id === updatedProcess.id ? updatedProcess : p);
      // If a process was completed, start the next one
      if (updatedProcess.status === 'Completed') {
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
                assignedTo: currentUser?.id || null,
                quantityIn: (updatedProcess.quantityOut || 0) + (updatedProcess.reworkQuantityOut || 0),
              };
            }
          }
        }
      }
      return newProcesses;
    });
  };

  const handleUpdateStatus = async (
    process: JobProcess,
    newStatus: 'Completed' | 'Rejected' | 'In Progress',
    quantityData: { launchedPanels?: number, quantityIn?: number, quantityOut?: number }
  ) => {
    // Store previous state for undo
    const previousProcessesState = [...jobProcesses];

    let updatedProcess: JobProcess;
    const isRework = newStatus === 'In Progress' && process.status !== 'Pending';

    if (isRework) {
      const newReworkQuantityIn = (process.reworkQuantityIn || 0) + (quantityData.quantityIn || 0);
      const newReworkQuantityOut = (process.reworkQuantityOut || 0) + (quantityData.quantityOut || 0);

      updatedProcess = {
        ...process,
        remarks: remarks[process.id] || process.remarks,
        reworkQuantityIn: newReworkQuantityIn,
        reworkQuantityOut: newReworkQuantityOut,
      };

      const totalIn = (process.quantityIn || 0) + newReworkQuantityIn;
      const totalOut = (process.quantityOut || 0) + newReworkQuantityOut;
      if (totalIn === totalOut) {
        updatedProcess.status = 'Completed';
        updatedProcess.endTime = new Date().toISOString();
        updatedProcess.quantityOut = totalOut;
        updatedProcess.reworkQuantityIn = 0;
        updatedProcess.reworkQuantityOut = 0;
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

    handleProcessUpdate(updatedProcess);

    try {
      await updateProcessStatusAction({
        jobId: id,
        processId: process.processId,
        newStatus: updatedProcess.status,
        remarks: remarks[process.id] || '',
        userId: currentUser?.id || '',
        quantityIn: quantityData.quantityIn,
        quantityOut: quantityData.quantityOut,
        reworkQuantityIn: isRework ? quantityData.quantityIn : undefined,
        reworkQuantityOut: isRework ? quantityData.quantityOut : undefined,
      });

      toast({
        title: `Process Updated`,
        description: `${allProcesses.find(p => p.processId === process.processId)?.processName} has been updated.`,
        action: (
          <Button
            variant="ghost"
            onClick={() => {
              handleProcessUpdate(previousProcessesState);
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
      handleProcessUpdate(previousProcessesState);
    } finally {
      setUpdateInfo(null);
      setRemarks(prev => ({ ...prev, [process.id]: '' }));
    }
  };

  const handleStartProcess = async (process: JobProcess) => {
    const previousProcessesState = [...jobProcesses];
    const updatedProcess = {
      ...process,
      status: 'In Progress' as const,
      startTime: new Date().toISOString(),
    };
    handleProcessUpdate(updatedProcess);

    try {
      await updateProcessStatusAction({
        jobId: id,
        processId: process.processId,
        newStatus: 'In Progress',
        userId: currentUser?.id || '',
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
      handleProcessUpdate(previousProcessesState);
    }
  };

  const openUpdateDialog = (process: JobProcess, newStatus: 'Completed' | 'Rejected' | 'In Progress') => {
    const processDef = allProcesses.find(p => p.processId === process.processId);
    if (!processDef) return;

    const isRework = newStatus === 'In Progress' && process.status !== 'Pending';
    const totalIn = (process.quantityIn || 0) + (process.reworkQuantityIn || 0);
    const totalOut = (process.quantityOut || 0) + (process.reworkQuantityOut || 0);
    const pendingQty = (process.quantityIn !== null || process.reworkQuantityIn !== null) ? totalIn - totalOut : null;

    const previousProcessJob = jobProcesses
      .map(jp => ({ jp, pDef: allProcesses.find(p => p.processId === jp.processId)! }))
      .filter(({ pDef }) => pDef.sequenceNumber < processDef.sequenceNumber)
      .sort((a, b) => b.pDef.sequenceNumber - a.pDef.sequenceNumber)
      .map(({ jp }) => jp)
      .find(jp => jp && (jp.quantityOut !== null || jp.launchedPanels !== null));

    const lastQuantity = isRework ? (pendingQty ?? 0) : (previousProcessJob?.quantityOut ?? previousProcessJob?.launchedPanels ?? process.quantityIn ?? null);
    const prefillQuantities = isRework ? { in: pendingQty ?? 0, out: 0 } : undefined;

    setUpdateInfo({ process, processDef, newStatus, lastQuantity, prefillQuantities });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!job || !currentUser) {
    return <div className="flex justify-center items-center h-64">Job not found</div>;
  }

  const daysLeft = differenceInBusinessDays(parseISO(job.dueDate), new Date());
  const completedProcesses = jobProcesses.filter(p => p.status === 'Completed').length;
  const totalProcesses = allProcesses.length;
  const progress = (completedProcesses / totalProcesses) * 100;

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
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Job Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Job {job.jobId.toUpperCase()}
              </CardTitle>
              <CardDescription className="text-lg">
                {job.customerName} - {job.partNo}
              </CardDescription>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Quantity: {job.quantity}</span>
                <span>Priority: <Badge variant={job.priority === 'High' ? 'destructive' : 'secondary'}>{job.priority}</Badge></span>
                <span>Due: {format(parseISO(job.dueDate), 'PPP')} ({daysLeft} days left)</span>
              </div>
            </div>
            <div className="text-right space-y-2">
              <Badge variant={job.status === 'Overdue' ? 'destructive' : job.status === 'Completed' ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                {job.status}
              </Badge>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Progress: {completedProcesses}/{totalProcesses}
              </div>
              <Progress value={progress} className="w-32" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline" className="text-lg">Process Timeline</TabsTrigger>
          <TabsTrigger value="traveller-card" className="text-lg">Traveller Card</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <div className="relative pl-8">
            {/* Vertical line */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border -translate-x-1/2" />

            <div className="space-y-8">
              {allProcesses.map((processDef) => {
                const process = jobProcesses.find((p) => p.processId === processDef.processId);
                if (!process) return null;

                const assignedUser = users.find((u) => u.id === process.assignedTo);
                const canUpdate = process.assignedTo === currentUser.id || (process.status === 'Pending' && currentUser.department === processDef.processName);

                const totalIn = (process.quantityIn || 0) + (process.reworkQuantityIn || 0);
                const totalOut = (process.quantityOut || 0) + (process.reworkQuantityOut || 0);
                const pendingQty = (process.quantityIn !== null || process.reworkQuantityIn !== null) ? totalIn - totalOut : null;

                return (
                  <div key={process.id} className="relative">
                    <div className="absolute left-4 top-5 -translate-x-1/2 -translate-y-1/2 bg-background p-1 rounded-full border-2 border-white shadow-lg">
                      {statusIcons[process.status]}
                    </div>
                    <Card className={`ml-8 border-l-4 shadow-md hover:shadow-lg transition-shadow ${statusColors[process.status]}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="text-xl">{processDef.processName}</CardTitle>
                            <CardDescription className="flex items-center space-x-2">
                              <span>Status: <Badge variant="outline">{process.status}</Badge></span>
                              {process.startTime && <span>| Started: {format(parseISO(process.startTime), 'PPp')}</span>}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            {assignedUser && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={assignedUser.avatarUrl} />
                                  <AvatarFallback>{assignedUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{assignedUser.name}</span>
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setHistoryProcess(process)}>
                                  View History
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {(process.remarks || (process.status === 'In Progress' && canUpdate)) && (
                          <div>
                            {process.status === 'In Progress' && canUpdate ? (
                              <Textarea
                                placeholder="Add remarks or issue notes..."
                                value={remarks[process.id] || ''}
                                onChange={(e) => setRemarks(prev => ({ ...prev, [process.id]: e.target.value }))}
                                className="min-h-[80px]"
                              />
                            ) : process.remarks && (
                              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border-l-4 border-blue-500">
                                <strong className="text-sm font-medium">Note:</strong> {process.remarks}
                              </div>
                            )}
                          </div>
                        )}

                        {(process.status !== 'Pending' && (process.quantityIn !== null || process.reworkQuantityIn !== null)) && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {process.quantityIn !== null && (
                              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                                <p className="font-medium text-blue-900 dark:text-blue-100">Original In</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{process.quantityIn}</p>
                              </div>
                            )}
                            {process.reworkQuantityIn !== null && (
                              <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-md">
                                <p className="font-medium text-orange-900 dark:text-orange-100">Rework In</p>
                                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{process.reworkQuantityIn}</p>
                              </div>
                            )}
                            {process.quantityOut !== null && (
                              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md">
                                <p className="font-medium text-green-900 dark:text-green-100">Original Out</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{process.quantityOut}</p>
                              </div>
                            )}
                            {process.reworkQuantityOut !== null && (
                              <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-md">
                                <p className="font-medium text-purple-900 dark:text-purple-100">Rework Out</p>
                                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{process.reworkQuantityOut}</p>
                              </div>
                            )}
                            {pendingQty !== null && pendingQty !== 0 && (
                              <div className={`col-span-2 p-3 rounded-md ${pendingQty > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                <p className={`font-medium ${pendingQty > 0 ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                  Pending Quantity
                                </p>
                                <p className={`text-2xl font-bold ${pendingQty > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {pendingQty}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="flex justify-end items-center space-x-4">
                        {(pendingQty ?? 0) > 0 && (
                          <Button variant="outline" size="lg" onClick={() => openUpdateDialog(process, 'In Progress')} className="flex items-center space-x-2">
                            <RefreshCw className="h-4 w-4" />
                            <span>Rework</span>
                          </Button>
                        )}
                        {canUpdate && process.status === 'Pending' && (
                          <Button onClick={() => handleStartProcess(process)} size="lg" className="flex items-center space-x-2">
                            <Play className="h-4 w-4" />
                            <span>Start Process</span>
                          </Button>
                        )}
                        {canUpdate && process.status === 'In Progress' && (
                          <div className="flex items-center space-x-4">
                            <Button variant="destructive" size="lg" onClick={() => openUpdateDialog(process, 'Rejected')} className="flex items-center space-x-2">
                              <XCircle className="h-4 w-4" />
                              <span>Issue / Reject</span>
                            </Button>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`complete-${process.id}`}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    openUpdateDialog(process, 'Completed');
                                  }
                                }}
                                checked={false}
                              />
                              <Label htmlFor={`complete-${process.id}`} className="font-semibold text-green-600 cursor-pointer">
                                Mark as Complete
                              </Label>
                            </div>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="traveller-card" className="mt-6">
          <TravellerCardInfo job={job} />
        </TabsContent>
      </Tabs>

      <ProcessUpdateDialog
        updateInfo={updateInfo}
        onOpenChange={() => setUpdateInfo(null)}
        onSubmit={handleUpdateStatus}
        remarks={updateInfo ? (remarks[updateInfo.process.id] || '') : ''}
        onRemarksChange={(remark) => updateInfo && setRemarks(prev => ({ ...prev, [updateInfo.process.id]: remark }))}
      />

      <Dialog open={!!historyProcess} onOpenChange={() => setHistoryProcess(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process History</DialogTitle>
            <DialogDescription>
              Details for {allProcesses.find(p => p.processId === historyProcess?.processId)?.processName}
            </DialogDescription>
          </DialogHeader>
          {historyProcess && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-lg font-semibold">{historyProcess.status}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <p className="text-sm font-medium">Assigned To</p>
                  <p className="text-lg font-semibold">{users.find(u => u.id === historyProcess.assignedTo)?.name || 'Unassigned'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <p className="text-sm font-medium">Start Time</p>
                  <p className="text-lg font-semibold">{historyProcess.startTime ? format(parseISO(historyProcess.startTime), 'PPp') : 'Not started'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <p className="text-sm font-medium">End Time</p>
                  <p className="text-lg font-semibold">{historyProcess.endTime ? format(parseISO(historyProcess.endTime), 'PPp') : 'Not completed'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <p className="text-sm font-medium">Original Quantity In</p>
                  <p className="text-lg font-semibold">{historyProcess.quantityIn ?? 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <p className="text-sm font-medium">Original Quantity Out</p>
                  <p className="text-lg font-semibold">{historyProcess.quantityOut ?? 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <p className="text-sm font-medium">Rework Quantity In</p>
                  <p className="text-lg font-semibold">{historyProcess.reworkQuantityIn ?? 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <p className="text-sm font-medium">Rework Quantity Out</p>
                  <p className="text-lg font-semibold">{historyProcess.reworkQuantityOut ?? 'N/A'}</p>
                </div>
              </div>
              {historyProcess.remarks && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Remarks</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{historyProcess.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}