// app/layout.js
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata = {
  title: "Evanshi Solution",
  description: "Educational Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}