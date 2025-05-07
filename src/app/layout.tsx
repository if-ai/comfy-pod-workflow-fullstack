import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/hooks/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Comfy POD Workflow Demo",
  description: "Generate product mockups with your logo using ComfyDeploy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <QueryProvider>
          <body className={inter.className}>
            {children}
            <Toaster />
          </body>
        </QueryProvider>
      </html>
    </ClerkProvider>
  );
}
