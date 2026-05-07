import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "Quản Lý Đầu Tư",
  description: "Ứng dụng quản lý đầu tư chứng khoán cá nhân",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
