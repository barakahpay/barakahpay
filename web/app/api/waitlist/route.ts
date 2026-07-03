import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

interface WaitlistEntry {
  name: string;
  email: string;
  role: 'sender' | 'school' | 'other';
  country: string;
  locale?: string;
  submittedAt: string;
  ip?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'waitlist.json');

async function readEntries(): Promise<WaitlistEntry[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as WaitlistEntry[];
  } catch {
    return [];
  }
}

async function writeEntries(entries: WaitlistEntry[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role, country, locale } = body;

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof country !== 'string' ||
      !['sender', 'school', 'other'].includes(role)
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const entries = await readEntries();
    const normalizedEmail = email.trim().toLowerCase();
    if (entries.some((e) => e.email.toLowerCase() === normalizedEmail)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const entry: WaitlistEntry = {
      name: name.trim(),
      email: normalizedEmail,
      role,
      country: country.trim(),
      locale: typeof locale === 'string' ? locale : undefined,
      submittedAt: new Date().toISOString(),
      ip: req.headers.get('x-forwarded-for') || undefined,
    };

    entries.push(entry);
    await writeEntries(entries);

    // eslint-disable-next-line no-console
    console.log(`[waitlist] +1 ${entry.role} from ${entry.country}`);

    return NextResponse.json({ ok: true, total: entries.length });
  } catch (err) {
    console.error('[waitlist] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  const entries = await readEntries();
  return NextResponse.json({ count: entries.length });
}
