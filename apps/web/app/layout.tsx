import type { ReactNode } from 'react';
import '../styles/globals.css';

export const metadata = {
  title: 'Unibot',
  description: 'Campus assistant for WhatsApp and web'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
