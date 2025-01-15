import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Camera Object Detection',
  description: 'Object detection using device camera and OpenCV.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script async src="https://cdnjs.cloudflare.com/ajax/libs/opencv.js/4.7.0/opencv.min.js"></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}