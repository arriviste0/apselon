import { NextResponse } from 'next/server';
import { getProcesses } from '@/lib/data';

export async function GET() {
  try {
    const processes = await getProcesses();
    return NextResponse.json(processes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load processes.' }, { status: 500 });
  }
}
