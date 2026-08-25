import { NextResponse } from 'next/server';
import { getAppUser } from '@/app/demo-user';
import { ensureCurrentUser, saveDailyEntry } from '@/db/app-data';

export async function POST(request: Request) {
  const user = await getAppUser();
  try {
    await ensureCurrentUser(user);
    await saveDailyEntry(user.userId, await request.json() as Record<string, unknown>);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '保存失败。' }, { status: 400 });
  }
}
