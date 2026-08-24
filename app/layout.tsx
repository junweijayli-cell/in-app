import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '智慧之光 · 成长同行',
  description: '记录每日行动，看见真实成长，让支持在需要时发生。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
