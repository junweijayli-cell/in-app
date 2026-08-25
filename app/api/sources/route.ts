import { NextResponse } from 'next/server';
import { getAppUser } from '@/app/demo-user';
import { ensureCurrentUser, saveSource } from '@/db/app-data';

export async function POST(request: Request) {
  const user = await getAppUser();
  try {
    const profile = await ensureCurrentUser(user);
    await saveSource(user.userId, profile.role, profile.cohort, await request.json() as Record<string, unknown>);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '导入失败。' }, { status: 400 });
  }
}
