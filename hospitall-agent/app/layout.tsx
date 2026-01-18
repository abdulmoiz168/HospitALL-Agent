import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/context/providers";

export const metadata: Metadata = {
  title: "HospitALL Local Sandbox",
  description: "Privacy-first clinical guidance agent (local sandbox build).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
