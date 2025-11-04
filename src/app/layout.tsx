import type { Metadata } from "next";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Excel Table Maker - Data Extraction & Correction",
  description:
    "Professional data extraction and correction tool with AI-powered accuracy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MantineProvider
          theme={{
            primaryColor: "blue",
            colors: {
              blue: [
                "#EEF5FF",
                "#B4D4FF",
                "#86B6F6",
                "#176B87",
                "#0F4C75",
                "#0A3A5C",
                "#08304A",
                "#062638",
                "#041C26",
                "#031214",
              ],
            },
            fontFamily: "Inter Tight, sans-serif",
            fontFamilyMonospace: "Inter Tight, monospace",
            headings: {
              fontFamily: "Inter Tight, sans-serif",
            },
          }}
        >
          <ModalsProvider>
            <Notifications position="top-right" />
            {children}
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
