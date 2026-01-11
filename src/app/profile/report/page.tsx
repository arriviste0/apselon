'use client';

import * as React from 'react';
import { Job, JobProcess, Process } from '@/lib/types';
import { useUser } from '@/components/user/user-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const getLeadTimeDays = (leadTime?: string) => {
  if (!leadTime) return null;
  const match = leadTime.match(/(\d+)/);
  return match ? Number(match[1]) : null;
};

const BarRow = ({
  label,
  value,
  total,
  colorClass,
}: {
  label: string;
  value: number;
  total: number;
  colorClass: string;
}) => {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function ReportSummaryPage() {
  const { user } = useUser();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [jobProcesses, setJobProcesses] = React.useState<JobProcess[]>([]);
  const [processes, setProcesses] = React.useState<Process[]>([]);
  const [timeFilter, setTimeFilter] = React.useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [jobsResponse, processesResponse, jobProcessesResponse] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/processes'),
          fetch('/api/job-processes'),
        ]);
        if (!jobsResponse.ok || !processesResponse.ok || !jobProcessesResponse.ok) {
          throw new Error('Failed to load report data');
        }
        const jobsData: Job[] = await jobsResponse.json();
        const processData: Process[] = await processesResponse.json();
        const jobProcessData: JobProcess[] = await jobProcessesResponse.json();
        setJobs(jobsData);
        setProcesses(processData);
        setJobProcesses(jobProcessData);
      } catch (error) {
        setJobs([]);
        setProcesses([]);
        setJobProcesses([]);
      }
    };
    loadData();
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Report & Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page is available for admin users only.
          </p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const getRangeStart = () => {
    switch (timeFilter) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };

  const rangeStart = getRangeStart();
  const isWithinRange = (dateValue?: string | null) => {
    if (!dateValue || !rangeStart) return true;
    const date = new Date(dateValue);
    return date >= rangeStart && date <= now;
  };

  const filteredJobs = jobs.filter((job) => isWithinRange(job.orderDate));
  const filteredJobIds = new Set(
    filteredJobs.map((job) =>
      (job.refNo && job.refNo.trim() ? job.refNo : job.jobId).toLowerCase()
    )
  );
  const filteredJobProcesses = jobProcesses.filter((process) =>
    filteredJobIds.has(process.jobId.toLowerCase())
  );

  const statusCounts = filteredJobs.reduce(
    (acc, job) => {
      acc.total += 1;
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    },
    { total: 0 } as Record<string, number>
  );

  const leadTimes = filteredJobs
    .map((job) => getLeadTimeDays(job.leadTime))
    .filter((value): value is number => value !== null);
  const averageLeadTime =
    leadTimes.length > 0
      ? Math.round(leadTimes.reduce((sum, value) => sum + value, 0) / leadTimes.length)
      : 0;

  const totalPcbs = filteredJobs.reduce((sum, job) => sum + (job.launchedPcbs || 0), 0);
  const totalPanels = filteredJobs.reduce((sum, job) => sum + (job.launchedPanels || 0), 0);
  const totalSqMtr = filteredJobs.reduce((sum, job) => sum + (job.launchedPcbSqm || 0), 0);
  const totalSetup = filteredJobs.reduce((sum, job) => sum + (job.setup ? 1 : 0), 0);
  const totalDoubleSide = filteredJobs.reduce(
    (sum, job) => sum + (job.layerType?.toLowerCase().includes('double') ? 1 : 0),
    0
  );
  const totalSingleSide = filteredJobs.reduce(
    (sum, job) => sum + (job.layerType?.toLowerCase().includes('single') ? 1 : 0),
    0
  );
  const totalRejects = filteredJobProcesses.reduce((sum, process) => sum + (process.rejectQuantity || 0), 0);

  const processCompletion = processes.map((process) => {
    const related = filteredJobProcesses.filter((jp) => jp.processId === process.processId);
    const completed = related.filter((jp) => jp.status === 'Completed').length;
    return {
      name: process.processName,
      completed,
      total: related.length,
    };
  });

  const customerReport = Object.values(
    filteredJobs.reduce<Record<string, { customer: string; jobs: number; pcbs: number; panels: number; sqm: number }>>(
      (acc, job) => {
        const key = job.customerName.trim();
        if (!acc[key]) {
          acc[key] = { customer: key, jobs: 0, pcbs: 0, panels: 0, sqm: 0 };
        }
        acc[key].jobs += 1;
        acc[key].pcbs += job.launchedPcbs || 0;
        acc[key].panels += job.launchedPanels || 0;
        acc[key].sqm += job.launchedPcbSqm || 0;
        return acc;
      },
      {}
    )
  ).sort((a, b) => b.jobs - a.jobs);

  const statusChartData = Object.entries(statusCounts)
    .filter(([key]) => key !== 'total')
    .map(([name, value]) => ({ name, value }));

  const jobsByDate = Array.from(
    filteredJobs.reduce<Map<string, number>>((acc, job) => {
      const dateKey = job.orderDate.slice(0, 10);
      acc.set(dateKey, (acc.get(dateKey) || 0) + 1);
      return acc;
    }, new Map())
  )
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const customerBarData = customerReport.slice(0, 8).map((entry) => ({
    name: entry.customer,
    jobs: entry.jobs,
    sqm: Number(entry.sqm.toFixed(2)),
  }));

  const processBarData = processCompletion.map((process) => ({
    name: process.name,
    completed: process.completed,
    total: process.total,
  }));

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Report & Summary</CardTitle>
            <div className="w-full sm:w-52">
              <Select
                value={timeFilter}
                onValueChange={(value) => setTimeFilter(value as typeof timeFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="day">Last 24 Hours</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            High-level performance and production insights.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Total Jobs</p>
            <p className="text-2xl font-semibold">{statusCounts.total}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Avg Lead Time</p>
            <p className="text-2xl font-semibold">{averageLeadTime} days</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Total Launched PCBs</p>
            <p className="text-2xl font-semibold">{totalPcbs}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Total Rejections</p>
            <p className="text-2xl font-semibold">{totalRejects}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Total SQ MTR</p>
            <p className="text-2xl font-semibold">{totalSqMtr.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Total Setups</p>
            <p className="text-2xl font-semibold">{totalSetup}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Double Side Jobs</p>
            <p className="text-2xl font-semibold">{totalDoubleSide}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Single Side Jobs</p>
            <p className="text-2xl font-semibold">{totalSingleSide}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {statusChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No status data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Jobs Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {jobsByDate.length === 0 ? (
              <p className="text-sm text-muted-foreground">No job history available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={jobsByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {customerBarData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No customer data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} height={60} angle={-20} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="jobs" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sqm" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Process Completion Chart</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {processBarData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No process data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} height={80} angle={-20} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BarRow
              label="In Progress"
              value={statusCounts['In Progress'] || 0}
              total={statusCounts.total}
              colorClass="bg-blue-500"
            />
            <BarRow
              label="Completed"
              value={statusCounts.Completed || 0}
              total={statusCounts.total}
              colorClass="bg-green-500"
            />
            <BarRow
              label="Overdue"
              value={statusCounts.Overdue || 0}
              total={statusCounts.total}
              colorClass="bg-red-500"
            />
            <BarRow
              label="Pending"
              value={statusCounts.Pending || 0}
              total={statusCounts.total}
              colorClass="bg-amber-500"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Process Completion</CardTitle>
            <Badge variant="secondary">Across all jobs</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {processCompletion.map((process) => (
              <BarRow
                key={process.name}
                label={process.name}
                value={process.completed}
                total={process.total || 1}
                colorClass="bg-primary"
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Customer-wise Report</CardTitle>
          <Badge variant="secondary">All customers</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {customerReport.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customer data available.</p>
          ) : (
            <div className="space-y-3">
              {customerReport.map((entry) => (
                <div key={entry.customer} className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-foreground">{entry.customer}</p>
                    <p className="text-sm text-muted-foreground">{entry.jobs} job(s)</p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <div>Total PCBs: <span className="font-medium text-foreground">{entry.pcbs}</span></div>
                    <div>Total SQ MTR: <span className="font-medium text-foreground">{entry.sqm.toFixed(2)}</span></div>
                    <div>Total Panels: <span className="font-medium text-foreground">{entry.panels}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Average lead time is <span className="font-medium text-foreground">{averageLeadTime}</span> days.
          </p>
          <p>
            Total launched panels: <span className="font-medium text-foreground">{totalPanels}</span>.
          </p>
          <p>
            Track rejection totals to prioritize quality improvements in high-volume processes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
