import { MainLayout } from "@/ui/components/shared/MainLayout";
import { SidebarProvider } from "@/ui/components/shared/SidebarContext";
import { NotificationProvider } from "@/ui/components/shared/NotificationContext";
import { QuotaProvider } from "@/features/auth/hooks/QuotaContext";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Providers } from "./providers";
import { Nunito, Fredoka } from "next/font/google";
import "./globals.css";

export const metadata = {
  title: "hanachan.org - Japanese Learning Platform",
  description: "Learn Japanese for free with hanachan.org, an open-source platform with no ads.",
  keywords: ["hanachan", "Japanese Learning", "JLPT", "Open Source", "No Ads"],
  authors: [{ name: "hanachan.org" }],
  applicationName: "hanachan.org",
  robots: "index, follow",
  openGraph: {
    title: "hanachan.org - Japanese Learning Platform",
    description: "Learn Japanese for free with hanachan.org, an open-source platform with no ads.",
    url: "https://hanachan.org/",
    images: ["https://hanachan.org/logo.png"],
    type: "website",
    siteName: "hanachan.org"
  },
};

export const viewport = {
  themeColor: "#FFF7F9",
  colorScheme: "light",
};


const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;

const nunito = Nunito({
  subsets: ["latin"],
  variable: '--font-nunito',
  display: 'swap',
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: '--font-fredoka',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${fredoka.variable} font-sans`}>
        <Providers>
          <NotificationProvider>
            <QuotaProvider>
              <SidebarProvider>
                <MainLayout>
                  {children}
                </MainLayout>
              </SidebarProvider>
            </QuotaProvider>
          </NotificationProvider>
        </Providers>
        {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
      </body>
    </html>
  );
}

