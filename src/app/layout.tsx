import type { Metadata } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['700'] // Bold for headlines as per Skailan brand
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  weight: ['400', '600'] // Regular and Semibold for body/UI text
});

export const metadata: Metadata = {
  title: 'Skailan',
  description: 'Tu universo digital, perfectamente conectado.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${openSans.variable} antialiased font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
