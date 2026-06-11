import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairoFont = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "مدير الردود على التعليقات - صيدلية أبناء الصغير",
  description: "لوحة تحكم تفاعلية متكاملة لعرض وتعديل الردود والتعليقات الخاصة بصيدلية أبناء الصغير",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "مدير التعليقات",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairoFont.variable} h-full antialiased`}
    >
      <head>
        {/* FontAwesome */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        />
        {/* PWA Compatibility Tags for iOS, Android and Desktop */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="مدير التعليقات" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png" />
        <meta name="theme-color" content="#FF6C37" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
