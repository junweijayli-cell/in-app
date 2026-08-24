import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getBootstrap } from '@/db/app-data';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: '请先登录。' }, { status: 401 });
  try {
    return NextResponse.json(await getBootstrap(user));
  } catch (error) {
    console.error('bootstrap failed', error);
    return NextResponse.json({ error: '暂时无法读取成长记录，请稍后重试。' }, { status: 500 });
  }
}
