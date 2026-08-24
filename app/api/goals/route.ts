import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureCurrentUser, saveGoal } from '@/db/app-data';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: '请先登录。' }, { status: 401 });
  try {
    await ensureCurrentUser(user);
    await saveGoal(user.userId, await request.json() as Record<string, unknown>);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '保存失败。' }, { status: 400 });
  }
}
