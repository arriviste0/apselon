'use client';

import * as React from 'react';
import { Job, JobProcess, Process } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { format, parseISO } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser } from '@/components/user/user-provider';

interface MasterClientProps {
  initialJobs: Job[];
}

export default function MasterClient({ initialJobs }: MasterClientProps) {
  const { user } = useUser();
  const [jobs, setJobs] = React.useState<Job[]>(initialJobs);
  const [jobProcesses, setJobProcesses] = React.useState<JobProcess[]>([]);
  const [processes, setProcesses] = React.useState<Process[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [customerFilter, setCustomerFilter] = React.useState('');
  const [jobTypeFilter, setJobTypeFilter] = React.useState<'all' | 'single' | 'double'>('all');
  const isAdmin = user?.role === 'admin';

  React.useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  React.useEffect(() => {
    const loadJobs = async () => {
      try {
        const [jobsResponse, processesResponse, jobProcessesResponse] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/processes'),
          fetch('/api/job-processes'),
        ]);
        if (!jobsResponse.ok || !processesResponse.ok || !jobProcessesResponse.ok) {
          throw new Error('Failed to load master data');
        }
        const fetchedJobs: Job[] = await jobsResponse.json();
        const fetchedProcesses: Process[] = await processesResponse.json();
        const fetchedJobProcesses: JobProcess[] = await jobProcessesResponse.json();
        setJobs(fetchedJobs);
        setProcesses(fetchedProcesses);
        setJobProcesses(fetchedJobProcesses);
      } catch (error) {
        // Keep initialJobs if the API fails.
      }
    };
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const searchValue = searchTerm.trim().toLowerCase();
    const customerValue = customerFilter.trim().toLowerCase();
    const layerType = job.layerType?.toLowerCase() ?? '';
    const matchesSearch =
      !searchValue ||
      job.jobId.toLowerCase().includes(searchValue) ||
      job.partNo.toLowerCase().includes(searchValue) ||
      job.customerName.toLowerCase().includes(searchValue);
    const matchesCustomer =
      !customerValue || job.customerName.toLowerCase().includes(customerValue);
    const matchesJobType =
      jobTypeFilter === 'all' ||
      (jobTypeFilter === 'double' && layerType.includes('double')) ||
      (jobTypeFilter === 'single' && layerType.includes('single'));

    return matchesSearch && matchesCustomer && matchesJobType;
  });

  const processById = React.useMemo(() => {
    return new Map(processes.map((process) => [process.processId, process]));
  }, [processes]);

  const getCurrentProcessName = React.useCallback((job: Job) => {
    const jobKey = (job.refNo && job.refNo.trim() ? job.refNo : job.jobId).toLowerCase();
    const processEntry = jobProcesses.find(
      (process) => process.jobId.toLowerCase() === jobKey && process.status === 'In Progress'
    );
    if (!processEntry) return '-';
    return processById.get(processEntry.processId)?.processName ?? '-';
  }, [jobProcesses, processById]);

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const formatDate = (value?: string | null) => {
    if (!value) return '';
    return format(parseISO(value), 'dd-MMM-yy');
  };

  const buildExcelHtml = () => {
    const title = 'Job Master List';
    const generatedAt = format(new Date(), 'dd-MMM-yy HH:mm');
    const rows = filteredJobs
      .map((job, index) => {
        const jobNo = job.jobId ? job.jobId.toUpperCase() : '';
        const currentProcess = getCurrentProcessName(job);
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(jobNo)}</td>
            <td>${escapeHtml(job.refNo ?? '')}</td>
            <td>${escapeHtml(job.partNo ?? '')}</td>
            <td>${escapeHtml(job.customerName ?? '')}</td>
            <td>${escapeHtml(formatDate(job.orderDate))}</td>
            <td>${escapeHtml(formatDate(job.dueDate))}</td>
            <td>${escapeHtml(currentProcess)}</td>
            <td>${escapeHtml(job.status ?? '')}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 12px; }
            th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }
            .title { font-weight: bold; font-size: 16px; text-align: center; }
            .meta { font-size: 11px; color: #555; }
            .header { font-weight: bold; background: #f5f5f5; }
          </style>
        </head>
        <body>
          <table>
            <tr><td class="title" colspan="9">${title}</td></tr>
            <tr><td class="meta" colspan="9">Generated: ${generatedAt}</td></tr>
            <tr>
              <td class="header">#</td>
              <td class="header">Job No</td>
              <td class="header">Ref. No</td>
              <td class="header">Part No</td>
              <td class="header">Customer Name</td>
              <td class="header">Issue Date</td>
              <td class="header">Delivery Date</td>
              <td class="header">Current Process</td>
              <td class="header">Status</td>
            </tr>
            ${rows || '<tr><td colspan="9">No jobs found.</td></tr>'}
          </table>
        </body>
      </html>
    `;
  };

  const handleExportExcel = () => {
    const html = buildExcelHtml();
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Job_Master_List_${format(new Date(), 'yyyyMMdd_HHmm')}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Job Master List</h1>
        <p className="text-sm text-muted-foreground">Browse all jobs and jump to details.</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Job ID, Part No, or Customer Name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full max-w-md">
          <Input
            placeholder="Filter by Customer Name..."
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          />
        </div>
        <div className="w-full max-w-xs">
          <Select value={jobTypeFilter} onValueChange={(value) => setJobTypeFilter(value as typeof jobTypeFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="single">Single Layer</SelectItem>
              <SelectItem value="double">Double Layer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isAdmin ? (
          <div className="w-full lg:w-auto lg:ml-auto">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="w-full lg:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job No</TableHead>
              <TableHead className="hidden sm:table-cell">Ref. No</TableHead>
              <TableHead>Part No</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead className="hidden md:table-cell">Issue Date</TableHead>
              <TableHead className="hidden lg:table-cell">Delivery Date</TableHead>
              <TableHead className="hidden md:table-cell">Current Process</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <TableRow key={`${job.jobId}-${job.createdAt}`}>
                  <TableCell className="font-medium">{job.jobId.toUpperCase()}</TableCell>
                  <TableCell className="hidden sm:table-cell">{job.refNo ?? '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{job.partNo}</span>
                      <span className="text-xs text-muted-foreground sm:hidden">
                        {job.customerName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{job.customerName}</TableCell>
                  <TableCell className="whitespace-nowrap hidden md:table-cell">{format(parseISO(job.orderDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="whitespace-nowrap hidden lg:table-cell">{format(parseISO(job.dueDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="hidden md:table-cell">{getCurrentProcessName(job)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{job.status}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/jobs/${encodeURIComponent(job.refNo && job.refNo.trim() ? job.refNo : job.jobId)}`}>
                            View Job
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No jobs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
