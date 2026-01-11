import { NextResponse } from 'next/server';
import { getJobProcesses } from '@/lib/data';

export async function GET() {
  try {
    const processes = await getJobProcesses();
    return NextResponse.json(processes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load job processes.' }, { status: 500 });
  }
}
