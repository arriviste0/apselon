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
import { User, Process, JobWithProcesses, JobProcess } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { suggestOptimalProcessAssignments, SuggestOptimalProcessAssignmentsOutput } from '@/ai/flows/suggest-optimal-process-assignments';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { createJobAction } from '@/app/actions';

const formSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  pcbType: z.enum(['Single-Sided', 'Double-Sided', 'Multi-Layer']).default('Single-Sided'),
  layers: z.coerce.number().optional(),
  material: z.string().optional(),
  thickness: z.coerce.number().optional(),
});

interface CreateJobDialogProps {
  users: User[];
  processes: Process[];
  onJobCreated: (newJob: JobWithProcesses) => void;
}

export function CreateJobDialog({ users, processes, onJobCreated }: CreateJobDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const [aiSuggestions, setAiSuggestions] = React.useState<SuggestOptimalProcessAssignmentsOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      description: '',
      quantity: 1,
      priority: 'Medium',
      pcbType: 'Single-Sided',
      layers: 1,
      material: 'FR-4',
      thickness: 1.6,
    },
  });

  const pcbType = form.watch('pcbType');

  const handleGenerateSuggestions = async () => {
    const values = form.getValues();
    if (!values.description || !values.dueDate || !values.quantity) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in Description, Quantity, and Due Date to get suggestions.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSuggesting(true);
    setAiSuggestions(null);
    try {
      const suggestions = await suggestOptimalProcessAssignments({
        jobDescription: values.description,
        quantity: values.quantity,
        dueDate: format(values.dueDate, 'yyyy-MM-dd'),
        processList: processes.map(p => p.processName)
      });
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI suggestion failed:', error);
      toast({
        title: 'AI Suggestion Failed',
        description: 'Could not generate suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // The action doesn't handle PCB fields yet, so we just pass the existing ones.
      const newJobWithProcesses = await createJobAction({
          customerName: values.customerName,
          description: values.description,
          quantity: values.quantity,
          priority: values.priority,
          dueDate: format(values.dueDate, 'yyyy-MM-dd'),
      });

      toast({
        title: 'Success!',
        description: `Job ${newJobWithProcesses.jobId.toUpperCase()} has been created.`,
      });
      onJobCreated(newJobWithProcesses);
      setOpen(false);
      form.reset();
      setAiSuggestions(null);
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
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new job. It will automatically be assigned all 17 processes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Innovate Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the job requirements..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <h3 className="text-md font-medium pt-2 border-b">PCB Details</h3>
                <FormField
                  control={form.control}
                  name="pcbType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PCB Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select PCB Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Single-Sided">Single-Sided</SelectItem>
                          <SelectItem value="Double-Sided">Double-Sided</SelectItem>
                          <SelectItem value="Multi-Layer">Multi-Layer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {pcbType === 'Multi-Layer' && (
                  <FormField
                    control={form.control}
                    name="layers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Layers</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 4" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., FR-4" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="thickness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thickness (mm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1.6" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
            </div>
            <div className="space-y-4">
              <Button type="button" variant="outline" className="w-full" onClick={handleGenerateSuggestions} disabled={isSuggesting}>
                {isSuggesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />
                )}
                Suggest Optimal Assignments with AI
              </Button>

              {isSuggesting && <div className="text-center p-4">Generating suggestions...</div>}
              {aiSuggestions && (
                <Card className="bg-secondary/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      AI-Powered Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                        <h4 className="font-semibold mb-2">Suggested Assignments:</h4>
                        <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                            {Object.entries(aiSuggestions.suggestedAssignments).map(([process, assignment]) => (
                                <li key={process}>
                                    <strong>{process}:</strong> {assignment}
                                </li>
                            ))}
                        </ul>
                    </div>
                     {aiSuggestions.potentialBottlenecks.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Potential Bottlenecks:</h4>
                            <div className="flex flex-wrap gap-2">
                                {aiSuggestions.potentialBottlenecks.map(bottleneck => (
                                    <span key={bottleneck} className="px-2 py-1 bg-destructive/20 text-destructive-foreground rounded-md text-xs">{bottleneck}</span>
                                ))}
                            </div>
                        </div>
                     )}
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter className="md:col-span-2">
                <Button type="submit">Create Job</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    