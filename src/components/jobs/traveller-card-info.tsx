'use client';

import { Job } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { addDays, format, parseISO } from 'date-fns';
import { Download, Printer } from 'lucide-react';

interface TravellerCardInfoProps {
  job: Job;
  isAdmin?: boolean;
}

const InfoItem = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
    <div className={className}>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <p className="text-sm font-medium leading-tight">{value || '-'}</p>
    </div>
);

export function TravellerCardInfo({ job, isAdmin = false }: TravellerCardInfoProps) {
  const handlePrint = () => {
    window.print();
  };

  const getLeadTimeDays = (leadTime?: string) => {
    if (!leadTime) return null;
    const match = leadTime.match(/(\d+)/);
    return match ? Number(match[1]) : null;
  };

  const leadTimeDays = getLeadTimeDays(job.leadTime);
  const deliveryDate = leadTimeDays !== null
    ? addDays(parseISO(job.orderDate), leadTimeDays)
    : parseISO(job.dueDate);
  const formattedJobId = job.jobId
    ? `${job.jobId.charAt(0).toUpperCase()}${job.jobId.slice(1)}`
    : job.jobId;
  const jobStatusLabel = job.isRepeat ? 'REPEAT' : 'NEW';

  const getDateValue = (value?: string) => {
    if (!value) return '';
    return format(parseISO(value), 'dd-MMM-yy');
  };

  const processSteps = [
    'Pre-Engg',
    'SHEARING',
    'CNC',
    'PTH',
    'Dry Film',
    'Plating',
    'ETCHING',
    'Pre-Mask Q.C.',
    'PISM - Coating',
    'PISM Expose & Develop',
    'HAL',
    'HAL Q.C',
    'LEGEND',
    'Routing',
    'BBT',
    'Q.C',
    'PACKING',
  ];

  const buildExcelHtml = () => {
    const totalSqm = (job.launchedPcbSqm ?? 0).toFixed(2);
    const customerRow = isAdmin
      ? `
            <tr>
              <td class="label">Customer</td><td colspan="4">${job.customerName ?? ''}</td>
              <td class="label">LEAD TIME</td><td colspan="2">${job.leadTime ?? ''}</td>
              <td colspan="4"></td>
            </tr>
        `
      : `
            <tr>
              <td class="label">LEAD TIME</td><td colspan="2">${job.leadTime ?? ''}</td>
              <td colspan="9"></td>
            </tr>
        `;
    const partNoRow = isAdmin
      ? `
            <tr>
              <td class="label">Part No</td><td colspan="4">${job.partNo ?? ''}</td>
              <td class="label">DEL DATE</td><td colspan="2">${getDateValue(job.dueDate)}</td>
              <td colspan="4"></td>
            </tr>
        `
      : `
            <tr>
              <td class="label">DEL DATE</td><td colspan="2">${getDateValue(job.dueDate)}</td>
              <td colspan="9"></td>
            </tr>
        `;
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 12px; }
            td, th { border: 1px solid #000; padding: 6px; vertical-align: top; line-height: 1.35; }
            .title { font-weight: bold; text-align: center; font-size: 16px; }
            .section { font-weight: bold; background: #f5f5f5; }
            .label { font-weight: bold; }
            .right { text-align: right; }
            .center { text-align: center; }
          </style>
        </head>
        <body>
          <table>
            <tr>
              <td class="title" colspan="12">TRAVELLER CARD</td>
            </tr>
            <tr>
              <td class="label">JOB NO</td><td colspan="2">${formattedJobId ?? ''}</td>
              <td>${jobStatusLabel}</td><td>${job.layerType ?? ''}</td>
              <td class="label">REF.NO</td><td colspan="2">${job.refNo ?? ''}</td>
              <td colspan="4"></td>
            </tr>
            ${customerRow}
            ${partNoRow}
            <tr>
              <td class="label">P.O.NO.</td><td colspan="2">${job.poNo ?? ''}</td>
              <td class="label">PO DATE</td><td colspan="2">${getDateValue(job.orderDate)}</td>
              <td class="label">Order qty</td><td colspan="2">${job.quantity ?? ''}</td>
              <td colspan="2"></td>
            </tr>
            <tr>
              <td class="label">Launched PCBs</td><td colspan="2">${job.launchedPcbs ?? ''}</td>
              <td class="label">Launched Panels</td><td colspan="2">${job.launchedPanels ?? ''}</td>
              <td class="label">SQ.MT</td><td colspan="2">${totalSqm}</td>
              <td colspan="2"></td>
            </tr>
            <tr>
              <td class="label">1PNL HOLE</td><td colspan="2">${job.pnlHole ?? ''}</td>
              <td class="label">TOTAL HOLE</td><td colspan="2">${job.totalHole ?? ''}</td>
              <td class="label" colspan="6">PANEL CURRENT:</td>
            </tr>
            <tr>
              <td class="section" colspan="6">Dimension Information</td>
              <td class="section" colspan="6">Material</td>
            </tr>
            <tr>
              <td class="label">PCB SIZE</td><td>${job.pcbSizeWidth ?? ''}</td><td>X</td><td>${job.pcbSizeHeight ?? ''}</td><td colspan="2"></td>
              <td class="label">Material</td><td colspan="2">${job.material ?? ''}</td><td class="label">UL LOGO</td><td colspan="2">${job.ulLogo ? 'YES' : 'NO'}</td>
            </tr>
            <tr>
              <td class="label">Array size</td><td>${job.arraySizeWidth ?? ''}</td><td>X</td><td>${job.arraySizeHeight ?? ''}</td><td colspan="2"></td>
              <td class="label">Copper wt</td><td colspan="2">${job.copperWeight ?? ''}</td><td colspan="2"></td><td></td>
            </tr>
            <tr>
              <td class="label">Ups Array</td><td>${job.upsArrayWidth ?? ''}</td><td>X</td><td>${job.upsArrayHeight ?? ''}</td><td colspan="2"></td>
              <td class="label">Thickness mm</td><td colspan="2">${job.thickness ?? ''}</td><td colspan="2"></td><td></td>
            </tr>
            <tr>
              <td class="label">Panel size</td><td>${job.panelSizeWidth ?? ''}</td><td>X</td><td>${job.panelSizeHeight ?? ''}</td><td colspan="2"></td>
              <td class="label">Source</td><td colspan="2">${job.source ?? ''}</td><td colspan="2"></td><td></td>
            </tr>
            <tr>
              <td class="label">Ups Panel</td><td>${job.upsPanel ?? ''}</td><td colspan="4"></td>
              <td class="label">Ink</td><td colspan="2">${job.ink ?? ''}</td><td colspan="2"></td><td></td>
            </tr>
            <tr>
              <td class="section" colspan="6">SPECIAL INSTRUCTION</td>
              <td class="section" colspan="6">CCL Cutting Plan</td>
            </tr>
            <tr>
              <td class="label">SOLDER MASK</td><td colspan="2">${job.solderMask ?? ''}</td><td colspan="3"></td>
              <td class="label">SHEET SIZE</td><td>${job.sheetSizeWidth ?? ''}</td><td>X</td><td>${job.sheetSizeHeight ?? ''}</td><td colspan="2"></td>
            </tr>
            <tr>
              <td class="label">LEGEND COLOUR</td><td colspan="2">${job.legendColour ?? ''}</td><td colspan="3"></td>
              <td class="label">SHEET UTILIZATION %</td><td colspan="5">${job.sheetUtilization ?? ''}</td>
            </tr>
            <tr>
              <td class="label">LEGEND SIDE</td><td colspan="2">${job.legendSide ?? ''}</td><td colspan="3"></td>
              <td class="label">NOS OF PANEL IN SHEET</td><td colspan="5">${job.panelsInSheet ?? ''}</td>
            </tr>
            <tr>
              <td class="label">SURFACE FINISH</td><td colspan="2">${job.surfaceFinish ?? ''}</td><td colspan="3"></td>
              <td class="label">SUPPLY INFO</td><td colspan="5">${job.supplyInfo ?? ''}</td>
            </tr>
            <tr>
              <td class="label">"V" GROVING</td><td colspan="2">${job.vGrooving ? 'YES' : 'NO'}</td><td colspan="3"></td>
              <td colspan="6"></td>
            </tr>
            <tr>
              <td class="label">CUTTING</td><td colspan="2">${job.cutting ?? ''}</td><td class="label">ROUTING</td><td colspan="2"></td>
              <td colspan="6"></td>
            </tr>
            <tr>
              <td class="label">M TRACE</td><td colspan="2">${job.mTraceSetup ?? ''}</td><td class="label">1 P</td><td colspan="2"></td>
              <td colspan="6"></td>
            </tr>
            <tr>
              <td colspan="12"></td>
            </tr>
            <tr>
              <td class="section">Process</td>
              <td class="section">In Date</td>
              <td class="section">In Qty</td>
              <td class="section">Out Date</td>
              <td class="section">Out Qty</td>
              <td class="section">Qty rej</td>
              <td class="section">Sign</td>
              <td class="section" colspan="5">Process Note</td>
            </tr>
            <tr>
              <td class="section">Seq</td>
              <td class="section" colspan="11"> </td>
            </tr>
            ${processSteps
              .map(
                (name, index) => `
            <tr>
              <td>${index + 1} ${name}</td>
              <td></td><td></td><td></td><td></td><td></td><td></td><td colspan="5"></td>
            </tr>`
              )
              .join('')}
          </table>
        </body>
      </html>
    `;
    return html;
  };

  const handleExportExcel = () => {
    const html = buildExcelHtml();
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Traveller_Card_${formattedJobId || 'job'}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="traveller-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Traveller Card Details</CardTitle>
        <div className="flex items-center gap-2 no-print">
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="flex items-center space-x-1">
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center space-x-1">
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-4">
            <InfoItem label="Job No." value={formattedJobId} />
            <InfoItem label="Ref. No." value={job.refNo} />
            {isAdmin ? (
              <InfoItem label="Customer" value={job.customerName} className="col-span-2" />
            ) : null}
            {isAdmin ? (
              <InfoItem label="Part No." value={job.partNo} className="col-span-2" />
            ) : null}
            <InfoItem label="Lead Time" value={job.leadTime} />
            <InfoItem label="Delivery Date" value={format(deliveryDate, 'dd-MMM-yy')} />
            <InfoItem label="P.O. No." value={job.poNo} />
            <InfoItem label="Issue Date" value={format(parseISO(job.orderDate), 'dd-MMM-yy')} />
            <InfoItem label="Order Qty" value={job.quantity} />
            <InfoItem label="Launched PCBs" value={job.launchedPcbs} />
            <InfoItem label="Launched Panels" value={job.launchedPanels} />
            <InfoItem label="Launch PCB SQM" value={job.launchedPcbSqm} />
            <InfoItem label="Launch Panel SQM" value={job.launchedPanelSqm} />
            <InfoItem label="1PNL Hole" value={job.pnlHole} />
            <InfoItem label="Total Hole" value={job.totalHole} />
            <InfoItem label="Repeat Job" value={job.isRepeat ? 'Yes' : 'No'} />
            <InfoItem label="Layers" value={job.layerType} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold text-base mb-2 border-b pb-1">Dimension Information</h4>
                <div className="grid grid-cols-2 gap-3">
                    <InfoItem label="PCB Size" value={`${job.pcbSizeWidth} x ${job.pcbSizeHeight}`} />
                    <InfoItem label="Array Size" value={`${job.arraySizeWidth} x ${job.arraySizeHeight}`} />
                    <InfoItem label="Ups Array" value={`${job.upsArrayWidth} x ${job.upsArrayHeight}`} />
                    <InfoItem label="Panel Size" value={`${job.panelSizeWidth} x ${job.panelSizeHeight}`} />
                    <InfoItem label="Ups Panel" value={job.upsPanel} />
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-base mb-2 border-b pb-1">Material</h4>
                 <div className="grid grid-cols-2 gap-3">
                    <InfoItem label="Material" value={job.material} />
                    <InfoItem label="UL Logo" value={job.ulLogo ? 'YES' : 'NO'} />
                    <InfoItem label="Copper wt" value={job.copperWeight} />
                    <InfoItem label="Thickness mm" value={job.thickness} />
                    <InfoItem label="Source" value={job.source} />
                    <InfoItem label="Ink" value={job.ink} />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold text-base mb-2 border-b pb-1">Special Instruction</h4>
                <div className="grid grid-cols-2 gap-3">
                    <InfoItem label="Solder Mask" value={job.solderMask} />
                    <InfoItem label="Legend Colour" value={job.legendColour} />
                    <InfoItem label="Legend Side" value={job.legendSide} />
                    <InfoItem label="Surface Finish" value={job.surfaceFinish} />
                    <InfoItem label="V Grooving" value={job.vGrooving ? 'YES' : 'NO'} />
                    <InfoItem label="Cutting" value={job.cutting} />
                    <InfoItem label="M Trace Setup" value={job.mTraceSetup} />
                    <InfoItem label="Setup" value={job.setup} />
                    <InfoItem label="1 P" value={job.oneP} />
                    <InfoItem label="Testing Required" value={job.testingRequired} />
                    <InfoItem label="Prepared By" value={job.preparedBy} />
                </div>
            </div>
             <div>
                <h4 className="font-semibold text-base mb-2 border-b pb-1">CCL Cutting Plan</h4>
                 <div className="grid grid-cols-2 gap-3">
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
