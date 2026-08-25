import { NextResponse } from 'next/server';
import { getAppUser } from '@/app/demo-user';
import { getBootstrap } from '@/db/app-data';

export async function GET() {
  const user = await getAppUser();
  try {
    return NextResponse.json(await getBootstrap(user));
  } catch (error) {
    console.error('bootstrap failed', error);
    return NextResponse.json({ error: '暂时无法读取成长记录，请稍后重试。' }, { status: 500 });
  }
}
