import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://zhihui-growth-light.junwei-jay-li.chatgpt.site'),
  title: '智慧之光 · 成长同行',
  description: '记录每日行动，看见真实成长，让支持在需要时发生。',
  openGraph: {
    title: '智慧之光 · 成长同行',
    description: '记录行动 · 看见成长 · 及时支持',
    url: 'https://zhihui-growth-light.junwei-jay-li.chatgpt.site',
    siteName: '智慧之光',
    locale: 'zh_CN',
    type: 'website',
    images: [{
      url: 'https://zhihui-growth-light.junwei-jay-li.chatgpt.site/zhihui-share.png',
      width: 1200,
      height: 630,
      alt: '智慧之光：记录行动、看见成长、及时支持',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '智慧之光 · 成长同行',
    description: '记录行动 · 看见成长 · 及时支持',
    images: ['https://zhihui-growth-light.junwei-jay-li.chatgpt.site/zhihui-share.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
