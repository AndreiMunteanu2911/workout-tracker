import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "@/app/globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Workout Tracker",
    description: "Track your workouts and progress with ease.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex bg-[var(--color-background)] text-[var(--color-foreground)]`}>
        <Navbar />
        <main className="flex-1 min-h-screen p-4 md:p-8 page-shell bg-[var(--surface)] text-[var(--color-foreground)]">
            {children}
        </main>
        </body>


        </html>
    );
}
