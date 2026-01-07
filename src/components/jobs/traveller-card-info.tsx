'use client';

import { Job } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';

interface TravellerCardInfoProps {
  job: Job;
}

const InfoItem = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
    <div className={className}>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || '-'}</p>
    </div>
);

export function TravellerCardInfo({ job }: TravellerCardInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traveller Card Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
            <InfoItem label="Job No." value={job.jobId} />
            <InfoItem label="Ref. No." value={job.refNo} />
            <InfoItem label="Customer" value={job.customerName} className="col-span-2"/>
            <InfoItem label="Part No." value={job.partNo} className="col-span-2"/>
            <InfoItem label="Lead Time" value={job.leadTime} />
            <InfoItem label="Del Date" value={format(parseISO(job.dueDate), 'dd-MMM-yy')} />
            <InfoItem label="P.O. No." value={job.poNo} />
            <InfoItem label="Order Date" value={format(parseISO(job.orderDate), 'dd-MMM-yy')} />
            <InfoItem label="Order Qty" value={job.quantity} />
            <InfoItem label="Launched PCBs" value={job.launchedPcbs} />
            <InfoItem label="Launched Panels" value={job.launchedPanels} />
            <InfoItem label="SQ.MT" value={job.sqMt} />
            <InfoItem label="1PNL Hole" value={job.pnlHole} />
            <InfoItem label="Total Hole" value={job.totalHole} />
            <InfoItem label="Repeat Job" value={job.isRepeat ? 'Yes' : 'No'} />
            <InfoItem label="Layers" value={job.layerType} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
                <h4 className="font-semibold text-lg mb-2 border-b pb-1">Dimension Information</h4>
                <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="PCB Size" value={`${job.pcbSizeWidth} x ${job.pcbSizeHeight}`} />
                    <InfoItem label="Array Size" value={`${job.arraySizeWidth} x ${job.arraySizeHeight}`} />
                    <InfoItem label="Ups Array" value={`${job.upsArrayWidth} x ${job.upsArrayHeight}`} />
                    <InfoItem label="Panel Size" value={`${job.panelSizeWidth} x ${job.panelSizeHeight}`} />
                    <InfoItem label="Ups Panel" value={job.upsPanel} />
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-lg mb-2 border-b pb-1">Material</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Material" value={job.material} />
                    <InfoItem label="UL Logo" value={job.ulLogo ? 'YES' : 'NO'} />
                    <InfoItem label="Copper wt" value={job.copperWeight} />
                    <InfoItem label="Thickness mm" value={job.thickness} />
                    <InfoItem label="Source" value={job.source} />
                    <InfoItem label="Ink" value={job.ink} />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
                <h4 className="font-semibold text-lg mb-2 border-b pb-1">Special Instruction</h4>
                <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Solder Mask" value={job.solderMask} />
                    <InfoItem label="Legend Colour" value={job.legendColour} />
                    <InfoItem label="Legend Side" value={job.legendSide} />
                    <InfoItem label="Surface Finish" value={job.surfaceFinish} />
                    <InfoItem label="V Grooving" value={job.vGrooving ? 'YES' : 'NO'} />
                    <InfoItem label="Cutting" value={job.cutting} />
                </div>
            </div>
             <div>
                <h4 className="font-semibold text-lg mb-2 border-b pb-1">CCL Cutting Plan</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Sheet Size" value={`${job.sheetSizeWidth} x ${job.sheetSizeHeight}`} />
                    <InfoItem label="Sheet Utilization %" value={job.sheetUtilization} />
                    <InfoItem label="Nos of Panel in Sheet" value={job.panelsInSheet} />
                    <InfoItem label="Supply Info" value={job.supplyInfo} className="col-span-2"/>
                </div>
            </div>
        </div>
         <InfoItem label="Additional Notes" value={job.description} />
      </CardContent>
    </Card>
  );
}
