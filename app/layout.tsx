import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SiteShell } from "@/components/site-shell";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

// export const metadata: Metadata = {
//   title: "Arham Humayun",
//   // description: "Arham Humayun's Personal Website",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} ${inter.className} antialiased flex flex-col min-h-screen`}
      >
        <ThemeProvider>
          <SiteShell>
            <Navbar />
            <main className="flex-grow w-full py-12">{children}</main>
            <Footer />
          </SiteShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
