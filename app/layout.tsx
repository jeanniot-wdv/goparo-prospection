import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Goparo Prospection",
  description: "Outil interne de saisie manuelle des contacts garages (Notion)",
  appleWebApp: { capable: true, title: "Goparo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full bg-background text-foreground">
        <Script id="goparo-theme" strategy="beforeInteractive">{`try {
          const saved = localStorage.getItem("goparo-theme");
          const dark = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches);
          document.documentElement.classList.toggle("dark", dark);
        } catch { document.documentElement.classList.toggle("dark", matchMedia("(prefers-color-scheme: dark)").matches); }`}</Script>
        <TooltipProvider delayDuration={400}>{children}</TooltipProvider>
        <Toaster
          position="bottom-center"
          offset={{ bottom: 80 }}
          mobileOffset={{ bottom: 88 }}
          toastOptions={{
            classNames: {
              toast: "cn-toast !rounded-md !border-border !bg-popover !text-popover-foreground !font-sans !text-sm",
              description: "!text-muted-foreground",
              actionButton: "!rounded-md !border !border-border !bg-secondary !font-semibold !text-link",
            },
          }}
        />
      </body>
    </html>
  );
}
