export type AppUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  isDemo: boolean;
};

export const PUBLIC_DEMO_USER: AppUser = {
  userId: 'public_demo',
  displayName: '智慧之光演示账户',
  email: 'public-demo@zhihui.local',
  fullName: '演示账户',
  isDemo: true,
};

export async function getAppUser(): Promise<AppUser> {
  return PUBLIC_DEMO_USER;
}
