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
  newStatus: 'Completed' | 'Rejected';
  lastQuantity: number | null;
}

interface ProcessUpdateDialogProps {
  updateInfo: ProcessUpdateInfo | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    process: JobProcess,
    newStatus: 'Completed' | 'Rejected',
    quantityData: { launchedPanels?: number; quantityIn?: number; quantityOut?: number }
  ) => void;
  remarks: string;
  onRemarksChange: (remarks: string) => void;
}

const qcProcesses = ['Pre-Mask Q.C.', 'BBT', 'Q.C', 'PACKING'];

export function ProcessUpdateDialog({
  updateInfo,
  onOpenChange,
  onSubmit,
  remarks,
  onRemarksChange,
}: ProcessUpdateDialogProps) {
  const isQcProcess = qcProcesses.includes(updateInfo?.processDef.processName || '');

  const formSchema = React.useMemo(() => {
    return z.object({
      launchedPanels: isQcProcess
        ? z.any().optional()
        : z.coerce.number().min(0, 'Quantity cannot be negative.'),
      quantityIn: !isQcProcess
        ? z.any().optional()
        : z.coerce.number().min(0, 'Quantity cannot be negative.'),
      quantityOut: !isQcProcess
        ? z.any().optional()
        : z.coerce.number().min(0, 'Quantity cannot be negative.'),
    });
  }, [isQcProcess]);

  type FormSchemaType = z.infer<typeof formSchema>;
  
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: isQcProcess ? {
        quantityIn: updateInfo?.lastQuantity ?? 0,
        quantityOut: 0,
    } : {
        launchedPanels: updateInfo?.lastQuantity ?? 0,
    }
  });

  React.useEffect(() => {
    if (updateInfo) {
      const defaultValues = isQcProcess ? {
        quantityIn: updateInfo.lastQuantity ?? 0,
        quantityOut: 0,
      } : {
        launchedPanels: updateInfo.lastQuantity ?? 0,
      };
      form.reset(defaultValues);
    }
  }, [updateInfo, isQcProcess, form]);


  const handleSubmit = (values: FormSchemaType) => {
    if (!updateInfo) return;
    const { process, newStatus } = updateInfo;
    onSubmit(process, newStatus, values);
  };
  
  const isOpen = !!updateInfo;
  const processName = updateInfo?.processDef.processName;
  const status = updateInfo?.newStatus;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Process: {processName}</DialogTitle>
          <DialogDescription>
            Confirming status as <span className={status === 'Completed' ? "text-green-600" : "text-destructive"}>{status}</span>. Please provide quantities.
          </DialogDescription>
        </DialogHeader>

        {updateInfo?.lastQuantity !== null && (
             <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Previous process output was <span className="font-semibold">{updateInfo?.lastQuantity}</span> panels.
                </AlertDescription>
            </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              {isQcProcess ? (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantityIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IN Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
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
              ) : (
                <FormField
                  control={form.control}
                  name="launchedPanels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity of Launched Panel</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
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
                {form.formState.isSubmitting ? 'Saving...' : `Confirm ${status}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
