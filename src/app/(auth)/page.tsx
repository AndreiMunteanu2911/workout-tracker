import Link from "next/link";
import Button from "@/components/Button";
import Image from "next/image";

export default function LandingPage() {
    return (
        <div className="w-full text-white relative min-h-screen">
            <div className="flex flex-row items-center pt-2 mb-28">
                <Image src="/assets/dumbbell-large.svg" alt="Dumbbell" width={40} height={40} className="invert" />
                <span className="ml-2 text-lg font-bold tracking-wide">FitPulse</span>
            </div>
            <div className="text-5xl font-semibold items-center justify-center text-center mb-12">Welcome</div>
            <div className = "flex flex-row items-center justify-center mb-12">
                <div className="text-2xl font-semibold mr-2">Start powering up your workouts with us today.</div>
            </div>
            <div className="flex flex-col gap-4">
                <Link href="/signup">
                    <Button className="w-full" variant="secondary">Sign Up</Button>
                </Link>
                <Link href="/login">
                    <Button className="w-full" variant="primary">Log In</Button>
                </Link>
            </div>
        </div>
    );
}
