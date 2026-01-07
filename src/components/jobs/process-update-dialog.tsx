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
import { Button } from '@/components/ui/button';
import { Textarea } from '../ui/textarea';
import { JobProcess, Process } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';

export interface ProcessUpdateInfo {
  process: JobProcess;
  processDef: Process;
  newStatus: 'Completed' | 'Rejected' | 'In Progress';
  lastQuantity: number | null;
  prefillQuantities?: { in: number; out: number };
}

interface ProcessUpdateDialogProps {
  updateInfo: ProcessUpdateInfo | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    process: JobProcess,
    newStatus: 'Completed' | 'Rejected' | 'In Progress',
    quantityData: { launchedPanels?: number; quantityIn?: number; quantityOut?: number }
  ) => void;
  remarks: string;
  onRemarksChange: (remarks: string) => void;
}

const formSchema = z.object({
  quantityIn: z.coerce.number().min(0, 'Quantity cannot be negative.'),
  quantityOut: z.coerce.number().min(0, 'Quantity cannot be negative.'),
  launchedPanels: z.any().optional(), // No longer used in the form, but keep for submission data structure
});

type FormSchemaType = z.infer<typeof formSchema>;


export function ProcessUpdateDialog({
  updateInfo,
  onOpenChange,
  onSubmit,
  remarks,
  onRemarksChange,
}: ProcessUpdateDialogProps) {

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        quantityIn: 0,
        quantityOut: 0,
    }
  });

  const isRework = React.useMemo(() => updateInfo?.newStatus === 'In Progress' && updateInfo.process.status !== 'Pending', [updateInfo]);

  React.useEffect(() => {
    if (updateInfo) {
      const defaultValues = {
        quantityIn: updateInfo.prefillQuantities?.in ?? (isRework ? 0 : updateInfo.lastQuantity ?? 0),
        quantityOut: updateInfo.prefillQuantities?.out ?? (updateInfo.newStatus === 'Completed' && !isRework ? (updateInfo.lastQuantity ?? 0) : 0),
      };
      form.reset(defaultValues);
    }
  }, [updateInfo, form, isRework]);


  const handleSubmit = (values: FormSchemaType) => {
    if (!updateInfo) return;
    const { process, newStatus } = updateInfo;
    onSubmit(process, newStatus, { ...values, launchedPanels: undefined });
  };
  
  const isOpen = !!updateInfo;
  const processName = updateInfo?.processDef.processName;
  const status = updateInfo?.newStatus;

  const getTitle = () => {
    if (isRework) return `Rework: ${processName}`;
    return `Update Process: ${processName}`;
  }

  const getDescription = () => {
    if (isRework) return `Log a rework for this process. The IN quantity is the number of pending items.`;
    return `Confirming status as `
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {getDescription()}
            {!isRework && <span className={status === 'Completed' ? "text-green-600" : "text-destructive"}>{status}</span>}
            . Please provide quantities.
          </DialogDescription>
        </DialogHeader>

        {updateInfo?.lastQuantity !== null && !isRework && (
             <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Previous process output was <span className="font-semibold">{updateInfo?.lastQuantity}</span> panels. This has been pre-filled as the IN quantity.
                </AlertDescription>
            </Alert>
        )}
        
        {isRework && (
             <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    You are reworking <span className="font-semibold">{updateInfo?.lastQuantity}</span> pending items.
                </AlertDescription>
            </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantityIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IN Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} readOnly={isRework} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantityOut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OUT Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormItem>
                  <FormLabel>Remarks / Notes</FormLabel>
                  <FormControl>
                      <Textarea 
                          placeholder="Add remarks or issue notes..." 
                          value={remarks}
                          onChange={(e) => onRemarksChange(e.target.value)}
                      />
                  </FormControl>
              </FormItem>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button 
                type="submit"
                variant={status === 'Rejected' ? 'destructive' : 'default'}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Saving...' : isRework ? 'Log Rework' : `Confirm ${status}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
