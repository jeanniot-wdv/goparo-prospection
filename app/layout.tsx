import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Archivo variable avec l'axe de largeur : titres en Expanded Black, UI en normal.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

// Toutes les données (tél., emails, CP, n° de ticket) sont en mono.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Goparo Prospection",
  description: "Outil interne de saisie manuelle des contacts garages (Notion)",
  appleWebApp: { capable: true, title: "Goparo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#edeae4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={cn("h-full antialiased", archivo.variable, geistMono.variable)}>
      <body className="h-full bg-ciment text-encre">
        <TooltipProvider delayDuration={400}>{children}</TooltipProvider>
        <Toaster
          position="bottom-center"
          offset={{ bottom: 88 }}
          mobileOffset={{ bottom: 96 }}
          toastOptions={{
            classNames: {
              toast: "cn-toast !border-encre !bg-encre !text-papier !font-sans",
              description: "!text-papier/70",
              actionButton: "!rounded-none !bg-signal !font-semibold !text-encre",
            },
          }}
        />
      </body>
    </html>
  );
}
