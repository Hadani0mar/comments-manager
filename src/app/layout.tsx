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
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
