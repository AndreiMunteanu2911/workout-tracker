"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const tabs = [
    { name: "Dashboard", href: "/dashboard", icon: "/assets/icon-dashboard.svg" },
    { name: "History", href: "/history", icon: "/assets/icon-history.svg" },
    { name: "Workout", href: "/workout", icon: "/assets/icon-workout.svg" },
    { name: "Exercises", href: "/exercises", icon: "/assets/icon-exercises.svg" },
    { name: "Profile", href: "/profile", icon: "/assets/icon-profile.svg" },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <>
            {/* Sidebar for desktop */}
            <nav className="hidden md:flex bg-white shadow-md w-64 min-h-screen p-4 flex-col">
                <h1 className="text-2xl font-bold mb-6">Workout Tracker</h1>
                <ul className="flex flex-col gap-2">
                    {tabs.map((tab) => (
                        <li key={tab.name}>
                            <Link
                                href={tab.href}
                                className={`flex items-center px-4 py-2 rounded hover:bg-gray-100 transition ${
                                    pathname === tab.href ? "bg-gray-200 font-semibold" : ""
                                }`}
                            >
                                <Image
                                    src={tab.icon}
                                    alt={tab.name + " icon"}
                                    width={24}
                                    height={24}
                                    className="mr-3"
                                />
                                {tab.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Bottom navbar for mobile */}
            <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white shadow-t border-t border-gray-200">
                <ul className="flex justify-around">
                    {tabs.map((tab) => (
                        <li key={tab.name}>
                            <Link
                                href={tab.href}
                                className={`flex flex-col items-center justify-center py-2 text-sm ${
                                    pathname === tab.href ? "text-blue-600 font-semibold" : "text-gray-600"
                                }`}
                            >
                                <Image
                                    src={tab.icon}
                                    alt={tab.name + " icon"}
                                    width={24}
                                    height={24}
                                />
                                <span className="mt-1">{tab.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}
