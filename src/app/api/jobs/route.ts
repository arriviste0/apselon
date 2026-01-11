import { NextResponse } from 'next/server';
import { getJobs } from '@/lib/data';

export async function GET() {
  try {
    const jobs = await getJobs();
    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load jobs.' }, { status: 500 });
  }
}
