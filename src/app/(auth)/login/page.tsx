'use client'

import {useState} from "react";
import supabase from "@/helper/supabaseClient"
import Link from "next/link";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

export default function LoginPage() {

    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event: any)=>{
        event.preventDefault();
        setMessage("");

        const {data,error} = await supabase.auth.signInWithPassword({
            email:email,
            password:password,
        });

        if (error)
        {
            setEmail("");
            setPassword("");
            setMessage(error.message);
            return;
        }
        if (data){
            router.push("/dashboard");
        }
        setEmail("");
        setPassword("");
    };

    return (
        <div className="min-w-full">
            <div className="text-3xl font-bold mb-4 ">Login</div>
            <form onSubmit={handleSubmit}>
                <input
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    type="email" placeholder="Enter your email address:" required></input>
                <input
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    type="password" placeholder="Enter your password:" required></input>
                <button type={"submit"}>Login</button>
            </form>
            {message && <div>{message}</div>}

            <Link href="/signup">
                <Button>Don't have an account?</Button>
            </Link>
        </div>
    );
}
