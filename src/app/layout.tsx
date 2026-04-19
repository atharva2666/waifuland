import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const svgFavicon = `data:image/svg+xml,%3Csvg%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad1%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%238a66f0%22%20%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23f7b8d4%22%20%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22central%22%20text-anchor%3D%22middle%22%20font-size%3D%2232%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22bold%22%20fill%3D%22url(%23grad1)%22%3EY%3C%2Ftext%3E%3C%2Fsvg%3E`;

export const metadata: Metadata = {
  title: 'Yoursonal',
  description: 'Explore images and media from multiple APIs',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: svgFavicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-body antialiased bg-background`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
