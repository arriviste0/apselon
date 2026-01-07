'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { User, Process, JobWithProcesses, Job } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createJobAction } from '@/app/actions';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { getJobs } from '@/lib/data';


const formSchema = z.object({
  isRepeat: z.boolean().default(false),
  layerType: z.string().default('Double Layer (D/S)'),
  jobId: z.string().trim().min(1, 'Job No. is required'),
  refNo: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  leadTime: z.string().optional(),
  partNo: z.string().min(1, 'Part No. is required'),
  dueDate: z.string().min(1, 'A due date is required.'),
  poNo: z.string().min(1, 'P.O. No. is required'),
  orderDate: z.string().min(1, 'An order date is required.'),
  quantity: z.coerce.number().min(1, 'Order quantity must be at least 1'),
  launchedPcbs: z.coerce.number().optional(),
  launchedPanels: z.coerce.number().optional(),
  launchedPcbSqm: z.coerce.number().optional(),
  launchedPanelSqm: z.coerce.number().optional(),
  pnlHole: z.coerce.number().optional(),
  totalHole: z.coerce.number().optional(),
  pcbSizeWidth: z.coerce.number().optional(),
  pcbSizeHeight: z.coerce.number().optional(),
  arraySizeWidth: z.coerce.number().optional(),
  arraySizeHeight: z.coerce.number().optional(),
  upsArrayWidth: z.coerce.number().optional(),
  upsArrayHeight: z.coerce.number().optional(),
  panelSizeWidth: z.coerce.number().optional(),
  panelSizeHeight: z.coerce.number().optional(),
  upsPanel: z.coerce.number().optional(),
  material: z.string().min(1, "Material is required"),
  copperWeight: z.string().optional(),
  thickness: z.coerce.number().optional(),
  source: z.string().optional(),
  ink: z.string().optional(),
  ulLogo: z.boolean().default(false),
  solderMask: z.string().optional(),
  legendColour: z.string().optional(),
  legendSide: z.string().optional(),
  surfaceFinish: z.string().optional(),
  vGrooving: z.boolean().default(false),
  cutting: z.string().optional(),
  mTraceSetup: z.string().optional(),
  oneP: z.string().optional(),
  setup: z.string().optional(),
  sheetSizeWidth: z.coerce.number().optional(),
  sheetSizeHeight: z.coerce.number().optional(),
  sheetUtilization: z.coerce.number().optional(),
  panelsInSheet: z.coerce.number().optional(),
  supplyInfo: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  testingRequired: z.string().optional(),
  preparedBy: z.string().optional(),
});

interface CreateJobDialogProps {
  users: User[];
  processes: Process[];
  onJobCreated: (newJob: JobWithProcesses) => void;
  onJobUpdated: (updatedJob: JobWithProcesses) => void;
  jobToEdit?: JobWithProcesses;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateJobDialog({ 
  users, 
  processes, 
  onJobCreated,
  onJobUpdated,
  jobToEdit,
  isOpen,
  onOpenChange,
}: CreateJobDialogProps) {
  const { toast } = useToast();
  const [allJobs, setAllJobs] = React.useState<Job[]>([]);
  
  const isEditing = !!jobToEdit;

  React.useEffect(() => {
    async function fetchJobs() {
        const jobs = await getJobs();
        setAllJobs(jobs);
    }
    if (isOpen) {
        fetchJobs();
    }
  }, [isOpen]);

  const defaultFormValues = {
        isRepeat: false,
        layerType: 'Double Layer (D/S)',
        jobId: "",
        refNo: "",
        customerName: "",
        leadTime: "",
        partNo: "",
        poNo: "WHATS APP",
        quantity: 0,
        launchedPcbs: 0,
        launchedPanels: 0,
        launchedPcbSqm: 0,
        launchedPanelSqm: 0,
        pnlHole: 0,
        totalHole: 0,
        pcbSizeWidth: 0,
        pcbSizeHeight: 0,
        arraySizeWidth: 0,
        arraySizeHeight: 0,
        upsArrayWidth: 0,
        upsArrayHeight: 0,
        panelSizeWidth: 0,
        panelSizeHeight: 0,
        upsPanel: 0,
        material: "FR4",
        copperWeight: "H/H (18/18)",
        thickness: 1.6,
        source: "Any",
        ink: "Any",
        ulLogo: false,
        solderMask: "GREEN",
        legendColour: "WHITE",
        legendSide: "BOTH",
        surfaceFinish: "HASL",
        vGrooving: false,
        cutting: "M-Cutting",
        mTraceSetup: "SETUP",
        oneP: "",
        setup: "",
        sheetSizeWidth: 0,
        sheetSizeHeight: 0,
        sheetUtilization: 0,
        panelsInSheet: 0,
        supplyInfo: "",
        description: "",
        priority: "Medium" as const,
        testingRequired: 'Normal BBT',
        preparedBy: 'Ashutosh Vyas',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        orderDate: format(new Date(), 'yyyy-MM-dd'),
    };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? {
        ...jobToEdit,
        dueDate: format(parseISO(jobToEdit!.dueDate), 'yyyy-MM-dd'),
        orderDate: format(parseISO(jobToEdit!.orderDate), 'yyyy-MM-dd'),
    } : defaultFormValues,
  });
  
  React.useEffect(() => {
    if (isEditing && jobToEdit) {
        form.reset({
            ...jobToEdit,
            dueDate: format(parseISO(jobToEdit.dueDate), 'yyyy-MM-dd'),
            orderDate: format(parseISO(jobToEdit.orderDate), 'yyyy-MM-dd'),
        });
    } else {
        form.reset(defaultFormValues);
    }
  }, [isEditing, jobToEdit, form]);

  const isRepeatJob = form.watch('isRepeat');
  
  const handleJobSelect = (jobId: string) => {
    const foundJob = allJobs.find(job => job.jobId === jobId);

    if (foundJob) {
        const {
            createdAt,
            status,
            jobId,
            leadTime,
            poNo,
            dueDate,
            orderDate,
            quantity,
            launchedPcbs,
            launchedPanels,
            launchedPcbSqm,
            launchedPanelSqm,
            // Keep the rest
            ...jobDataToCopy
        } = foundJob;

        form.reset({
            ...jobDataToCopy,
            isRepeat: true,
            jobId: "", // Reset jobId for new repeat job
            dueDate: format(new Date(), 'yyyy-MM-dd'), // Reset to current date
            orderDate: format(new Date(), 'yyyy-MM-dd'), // Reset to current date
        });

        toast({ title: `Copied details from Job ${foundJob.jobId.toUpperCase()}` });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isEditing) {
          // This is a mock update. In a real app, you'd call an update action.
          const updatedJob: JobWithProcesses = {
            ...jobToEdit!,
            ...values,
          };
          onJobUpdated(updatedJob);
          toast({
            title: 'Success!',
            description: `Job ${updatedJob.jobId.toUpperCase()} has been updated.`,
          });
      } else {
        const jobData: Job = {
            ...values,
            createdAt: new Date().toISOString(),
            status: 'In Progress',
        };

        const newJobWithProcesses = await createJobAction(jobData);
        onJobCreated(newJobWithProcesses);
        toast({
          title: 'Success!',
          description: `Job ${newJobWithProcesses.jobId.toUpperCase()} has been created.`,
        });
      }
      
      onOpenChange(false);
      form.reset(defaultFormValues);
    } catch (error) {
        toast({
            title: 'Error',
            description: 'Failed to save job. Please try again.',
            variant: 'destructive',
        });
    }
  }
  

  const dialogTitle = isEditing ? `Edit Job ${jobToEdit?.jobId.toUpperCase()}` : 'Create New Job (Traveller Card)';
  const dialogDescription = isEditing ? 'Update the details for this job.' : 'Fill in the details from the traveller card to create a new job.';
  const buttonText = isEditing ? 'Save Changes' : 'Create Job';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
            form.reset(defaultFormValues);
        }
    }}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[70vh] pr-6">
            <div className="space-y-6">

            <div className="flex items-center space-x-8">
              <FormField
                control={form.control}
                name="isRepeat"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (!checked) {
                                form.reset(defaultFormValues);
                            }
                        }}
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Is this a repeat job?
                    </FormLabel>
                  </FormItem>
              )} />
              <FormField
                control={form.control}
                name="layerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Layers</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of layers" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Single Layer (S/S)">Single Layer (S/S)</SelectItem>
                        <SelectItem value="Double Layer (D/S)">Double Layer (D/S)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )} />
            </div>

            {isRepeatJob && !isEditing && (
                <div className="p-4 border rounded-lg bg-muted/50">
                    <FormLabel>Find Existing Job to Copy</FormLabel>
                    <Select onValueChange={handleJobSelect}>
                        <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select job to copy..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allJobs.map((job) => (
                                <SelectItem key={job.jobId} value={job.jobId}>
                                    {job.jobId.toUpperCase()} - {job.customerName} - {job.partNo}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
            
            {/* Column 1 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Job Info</h3>
                 <FormField control={form.control} name="jobId" render={({ field }) => (
                    <FormItem><FormLabel>Job No.</FormLabel><FormControl><Input placeholder="A2511" {...field} disabled={isEditing || isRepeatJob} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="refNo" render={({ field }) => (
                    <FormItem><FormLabel>Ref. No</FormLabel><FormControl><Input placeholder="6" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem><FormLabel>Customer</FormLabel><FormControl><Input placeholder="A03 ARVI(VISHAL BHAI)" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="leadTime" render={({ field }) => (
                    <FormItem><FormLabel>Lead Time</FormLabel><FormControl><Input placeholder="5 DAY" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="partNo" render={({ field }) => (
                    <FormItem><FormLabel>Part No.</FormLabel><FormControl><Input placeholder="LL502_R3" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem><FormLabel>Del Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="poNo" render={({ field }) => (
                   <FormItem>
                      <FormLabel>P.O. Number</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a P.O. type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EMAIL">EMAIL</SelectItem>
                          <SelectItem value="VERBAL">VERBAL</SelectItem>
                          <SelectItem value="WHATS APP">WHATS APP</SelectItem>
                          <SelectItem value="PO">PO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="orderDate" render={({ field }) => (
                  <FormItem><FormLabel>Order Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem><FormLabel>Order Qty</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="launchedPcbs" render={({ field }) => (
                    <FormItem><FormLabel>Launched PCBs</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="launchedPanels" render={({ field }) => (
                    <FormItem><FormLabel>Launched Panels</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="launchedPcbSqm" render={({ field }) => (
                    <FormItem><FormLabel>Launch PCB SQM</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="launchedPanelSqm" render={({ field }) => (
                    <FormItem><FormLabel>Launch Panel SQM</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="pnlHole" render={({ field }) => (
                    <FormItem><FormLabel>1PNL Hole</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="totalHole" render={({ field }) => (
                    <FormItem><FormLabel>Total Hole</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Dimension & Material</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="pcbSizeWidth" render={({ field }) => (
                  <FormItem><FormLabel>PCB Width</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pcbSizeHeight" render={({ field }) => (
                  <FormItem><FormLabel>PCB Length</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="arraySizeWidth" render={({ field }) => (
                  <FormItem><FormLabel>Array Width</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="arraySizeHeight" render={({ field }) => (
                  <FormItem><FormLabel>Array Length</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
               <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="upsArrayWidth" render={({ field }) => (
                  <FormItem><FormLabel>Ups Array W</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="upsArrayHeight" render={({ field }) => (
                  <FormItem><FormLabel>Ups Array L</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
               <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="panelSizeWidth" render={({ field }) => (
                  <FormItem><FormLabel>Panel Width</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="panelSizeHeight" render={({ field }) => (
                  <FormItem><FormLabel>Panel Length</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
               <FormField control={form.control} name="upsPanel" render={({ field }) => (
                  <FormItem><FormLabel>Ups Panel</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="material" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Material Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FR4">FR4</SelectItem>
                          <SelectItem value="CEM-1">CEM-1</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
              )} />
              <FormField control={form.control} name="copperWeight" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Copper Thickness (oz)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select copper thickness" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="H/H (18/18)">H/H (18/18)</SelectItem>
                          <SelectItem value="1/1 (35/35)">1/1 (35/35)</SelectItem>
                          <SelectItem value="1/0 (35/0)">1/0 (35/0)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
              )} />
              <FormField control={form.control} name="thickness" render={({ field }) => (
                    <FormItem>
                      <FormLabel>PCB Thickness</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select thickness" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1.0">1.0 mm</SelectItem>
                          <SelectItem value="1.2">1.2 mm</SelectItem>
                          <SelectItem value="1.6">1.6 mm</SelectItem>
                          <SelectItem value="2.0">2.0 mm</SelectItem>
                          <SelectItem value="2.4">2.4 mm</SelectItem>
                          <SelectItem value="3.2">3.2 mm</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
              )} />
               <FormField control={form.control} name="source" render={({ field }) => (
                  <FormItem><FormLabel>Source</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="ink" render={({ field }) => (
                  <FormItem><FormLabel>Ink</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="ulLogo" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>UL Logo</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )} />
            </div>

            {/* Column 3 */}
             <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Instructions & Planning</h3>
                <FormField control={form.control} name="solderMask" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Masking Colour</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GREEN">GREEN</SelectItem>
                          <SelectItem value="BLUE">BLUE</SelectItem>
                          <SelectItem value="RED">RED</SelectItem>
                          <SelectItem value="WHITE">WHITE</SelectItem>
                          <SelectItem value="BLACK">BLACK</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="legendColour" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Legend Colour</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="WHITE">WHITE</SelectItem>
                          <SelectItem value="BLACK">BLACK</SelectItem>
                           <SelectItem value="NONE">NONE</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="legendSide" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Legend Side</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select side" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="TOP">TOP</SelectItem>
                           <SelectItem value="BOT">BOT</SelectItem>
                           <SelectItem value="BOTH">BOTH</SelectItem>
                           <SelectItem value="NONE">NONE</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="surfaceFinish" render={({ field }) => (
                   <FormItem>
                      <FormLabel>Surface Finish</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select finish" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="HASL">HASL</SelectItem>
                          <SelectItem value="TIN">TIN</SelectItem>
                          <SelectItem value="IMARSION GOLD(ENIG)">IMARSION GOLD(ENIG)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="vGrooving" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>"V" Grooving</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )} />
                <FormField
                  control={form.control}
                  name="cutting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cutting</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a cutting method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M-Cutting">M-Cutting</SelectItem>
                          <SelectItem value="Routing">Routing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="mTraceSetup" render={({ field }) => (
                    <FormItem><FormLabel>M Trace Setup</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="setup" render={({ field }) => (
                    <FormItem><FormLabel>Setup</FormLabel><FormControl><Input {...field} disabled={isRepeatJob} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="oneP" render={({ field }) => (
                    <FormItem><FormLabel>1 P</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField
                  control={form.control}
                  name="testingRequired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Testing Required</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select testing type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Flying Probe Testing">Flying Probe Testing</SelectItem>
                          <SelectItem value="Normal BBT">Normal BBT</SelectItem>
                          <SelectItem value="NONE">NONE</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="preparedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prepared By</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select preparer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Thakor Babuji">Thakor Babuji</SelectItem>
                          <SelectItem value="Ashutosh Vyas">Ashutosh Vyas</SelectItem>
                          <SelectItem value="Patel Siddhi">Patel Siddhi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <h4 className="text-md font-semibold border-b pb-1 pt-2">CCL Cutting Plan</h4>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="sheetSizeWidth" render={({ field }) => (
                    <FormItem><FormLabel>Sheet Width</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="sheetSizeHeight" render={({ field }) => (
                    <FormItem><FormLabel>Sheet Length</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="sheetUtilization" render={({ field }) => (
                    <FormItem><FormLabel>Sheet Utilization %</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="panelsInSheet" render={({ field }) => (
                    <FormItem><FormLabel>Nos of Panel in Sheet</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="supplyInfo" render={({ field }) => (
                    <FormItem><FormLabel>Supply Info</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any other special instructions..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            </div>
            </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : buttonText}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
