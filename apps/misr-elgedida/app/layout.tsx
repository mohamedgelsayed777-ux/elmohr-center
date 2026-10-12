import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ELMOHR CENTER – Misr El Gedida",
  description: "نظام إدارة فرع مركز المهر – مصر الجديدة"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
