import type { Metadata } from "next";
import "@/app/globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aydemir İnşaat | Dijital Portföy",
    template: "%s | Aydemir İnşaat",
  },
  description: "Antalya Kepez bölgesindeki güncel Aydemir İnşaat portföyleri.",
};

const themeScript = `
  try {
    const saved = localStorage.getItem('aydemir-theme');
    const dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
