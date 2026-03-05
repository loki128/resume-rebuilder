import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "resume-ai-enhancer",
  description: "Rewrite resumes to match job descriptions without inventing facts.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
