import Link from "next/link";
import Button from "@/components/Button";

export default function LandingPage() {
    return (
        <div className="min-w-full">
            <div className="text-3xl font-bold flex flex-col ">Hello</div>
            <Link href="/signup">
                <Button>Sign Up</Button>
            </Link>
            <Link href="/login">
                <Button>Log In</Button>
            </Link>
        </div>
    );
}
