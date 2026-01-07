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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { User, Process, JobWithProcesses, Job } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { suggestOptimalProcessAssignments, SuggestOptimalProcessAssignmentsOutput } from '@/ai/flows/suggest-optimal-process-assignments';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { createJobAction } from '@/app/actions';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';


const formSchema = z.object({
  isRepeat: z.boolean().default(false),
  layerType: z.enum(['Single', 'Double']).default('Double'),
  jobId: z.string().min(1, 'Job No. is required'),
  refNo: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  leadTime: z.string().optional(),
  partNo: z.string().min(1, 'Part No. is required'),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  poNo: z.string().min(1, 'P.O. No. is required'),
  orderDate: z.date({ required_error: 'An order date is required.' }),
  quantity: z.coerce.number().min(1, 'Order quantity must be at least 1'),
  launchedPcbs: z.coerce.number().optional(),
  launchedPanels: z.coerce.number().optional(),
  sqMt: z.coerce.number().optional(),
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
  routing: z.string().optional(),
  sheetSizeWidth: z.coerce.number().optional(),
  sheetSizeHeight: z.coerce.number().optional(),
  sheetUtilization: z.coerce.number().optional(),
  panelsInSheet: z.coerce.number().optional(),
  supplyInfo: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
});

interface CreateJobDialogProps {
  users: User[];
  processes: Process[];
  onJobCreated: (newJob: JobWithProcesses) => void;
}

export function CreateJobDialog({ users, processes, onJobCreated }: CreateJobDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        isRepeat: false,
        layerType: 'Double',
        jobId: "",
        refNo: "",
        customerName: "",
        leadTime: "",
        partNo: "",
        poNo: "",
        quantity: 0,
        launchedPcbs: 0,
        launchedPanels: 0,
        sqMt: 0,
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
        material: "D/S FR4",
        copperWeight: "18/18",
        thickness: 1.6,
        source: "Any",
        ink: "Any",
        ulLogo: false,
        solderMask: "GREEN",
        legendColour: "WHITE",
        legendSide: "BOTH",
        surfaceFinish: "HAL",
        vGrooving: false,
        cutting: "M-CUTTING",
        routing: "ROUTING",
        sheetSizeWidth: 0,
        sheetSizeHeight: 0,
        sheetUtilization: 0,
        panelsInSheet: 0,
        supplyInfo: "",
        description: "",
        priority: "Medium",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const jobData: Job = {
          ...values,
          dueDate: format(values.dueDate, 'yyyy-MM-dd'),
          orderDate: format(values.orderDate, 'yyyy-MM-dd'),
          // These are not on the form, but required by the type
          createdAt: new Date().toISOString(),
          status: 'In Progress',
      };

      const newJobWithProcesses = await createJobAction(jobData);

      toast({
        title: 'Success!',
        description: `Job ${newJobWithProcesses.jobId.toUpperCase()} has been created.`,
      });
      onJobCreated(newJobWithProcesses);
      setOpen(false);
      form.reset();
    } catch (error) {
        toast({
            title: 'Error',
            description: 'Failed to create job. Please try again.',
            variant: 'destructive',
        });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Create New Job (Traveller Card)</DialogTitle>
          <DialogDescription>
            Fill in the details from the traveller card to create a new job.
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
                        onCheckedChange={field.onChange}
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
                  <FormItem className="space-y-3">
                    <FormLabel>Number of Layers</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Single" />
                          </FormControl>
                          <FormLabel className="font-normal">Single Sided</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Double" />
                          </FormControl>
                          <FormLabel className="font-normal">Double Sided</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
            
            {/* Column 1 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Job Info</h3>
                 <FormField control={form.control} name="jobId" render={({ field }) => (
                    <FormItem><FormLabel>Job No.</FormLabel><FormControl><Input placeholder="A2511" {...field} /></FormControl><FormMessage /></FormItem>
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
                  <FormItem className="flex flex-col"><FormLabel>Del Date</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                    <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="poNo" render={({ field }) => (
                    <FormItem><FormLabel>P.O. No.</FormLabel><FormControl><Input placeholder="WHATSAPP" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="orderDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Order Date</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                    <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
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
                 <FormField control={form.control} name="sqMt" render={({ field }) => (
                    <FormItem><FormLabel>SQ.MT</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
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
                  <FormItem><FormLabel>PCB Height</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="arraySizeWidth" render={({ field }) => (
                  <FormItem><FormLabel>Array Width</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="arraySizeHeight" render={({ field }) => (
                  <FormItem><FormLabel>Array Height</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
               <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="upsArrayWidth" render={({ field }) => (
                  <FormItem><FormLabel>Ups Array W</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="upsArrayHeight" render={({ field }) => (
                  <FormItem><FormLabel>Ups Array H</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
               <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="panelSizeWidth" render={({ field }) => (
                  <FormItem><FormLabel>Panel Width</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="panelSizeHeight" render={({ field }) => (
                  <FormItem><FormLabel>Panel Height</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
               <FormField control={form.control} name="upsPanel" render={({ field }) => (
                  <FormItem><FormLabel>Ups Panel</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="material" render={({ field }) => (
                  <FormItem><FormLabel>Material</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="copperWeight" render={({ field }) => (
                  <FormItem><FormLabel>Copper wt</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="thickness" render={({ field }) => (
                  <FormItem><FormLabel>Thickness mm</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
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
                  <FormItem><FormLabel>Solder Mask</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="legendColour" render={({ field }) => (
                  <FormItem><FormLabel>Legend Colour</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="legendSide" render={({ field }) => (
                  <FormItem><FormLabel>Legend Side</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="surfaceFinish" render={({ field }) => (
                  <FormItem><FormLabel>Surface Finish</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="vGrooving" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>"V" Grooving</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )} />
                 <FormField control={form.control} name="cutting" render={({ field }) => (
                  <FormItem><FormLabel>Cutting</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="routing" render={({ field }) => (
                  <FormItem><FormLabel>Routing</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <h4 className="text-md font-semibold border-b pb-1 pt-2">CCL Cutting Plan</h4>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="sheetSizeWidth" render={({ field }) => (
                    <FormItem><FormLabel>Sheet Width</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="sheetSizeHeight" render={({ field }) => (
                    <FormItem><FormLabel>Sheet Height</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
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
                <Button type="submit">Create Job</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
