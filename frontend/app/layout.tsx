import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Manrope } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { ThemeProvider } from '@/components/theme/theme-provider';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], display: 'swap', variable: '--font-manrope' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: { default: 'RESOMESH · Enterprise Entity Resolution Console', template: '%s · RESOMESH' },
  description: 'Production-grade business entity resolution, multi-pass candidate blocking, and ML validation console backed by Amazon ML ER.',
};

/**
 * Applies the stored (or default dark) theme before first paint so the interface
 * never flashes the wrong theme while React hydrates.
 */
const themeScript = `(function(){try{var s=localStorage.getItem('resomesh-theme')||localStorage.getItem('convia-theme');var t='dark';if(s==='resomesh'){t='resomesh';}else if(s==='light'){t='light';}else if(s==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var r=document.documentElement;r.dataset.theme=t;r.style.colorScheme=t==='dark'?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const fontVariables = `${inter.variable} ${manrope.variable} ${jetbrains.variable}`;
  return (
    <html lang="en" data-theme="dark" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
