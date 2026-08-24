import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureCurrentUser, saveSupport } from '@/db/app-data';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: '请先登录。' }, { status: 401 });
  try {
    const profile = await ensureCurrentUser(user);
    await saveSupport(user.userId, profile.role, await request.json() as Record<string, unknown>);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '保存失败。' }, { status: 400 });
  }
}
