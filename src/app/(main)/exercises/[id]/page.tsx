"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import supabase from "@/helper/supabaseClient";
import { Exercise } from "@/components/ExerciseCard";

export default function ExerciseDetailsPage() {
    const { id } = useParams();
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExercise = async () => {
            const { data, error } = await supabase
                .from("exercises")
                .select("*")
                .eq("exercise_id", id)
                .single();

            if (error) {
                console.error("Error fetching exercise:", error);
            } else {
                setExercise(data);
            }
            setLoading(false);
        };

        fetchExercise();
    }, [id]);

    if (loading) {
        return (
            <ProtectedWrapper>
                <div className="p-4">Loading exercise details...</div>
            </ProtectedWrapper>
        );
    }

    if (!exercise) {
        return (
            <ProtectedWrapper>
                <div className="p-4 text-red-600">Exercise not found.</div>
            </ProtectedWrapper>
        );
    }

    return (
        <ProtectedWrapper>
            <div className="p-4">
                <div className="mb-4">
                    <h1 className="text-3xl font-semibold">{exercise.name}</h1>
                    <div className="text-sm text-[var(--muted-foreground)]">{exercise.body_parts?.join(", ")}</div>
                </div>

                {exercise.gif_url && (
                    <div className="mb-6 border rounded-sm p-4 bg-white">
                        <img
                            src={exercise.gif_url}
                            alt={exercise.name}
                            className="rounded-sm max-w-full h-auto"
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-4">
                        <div className="text-sm font-semibold text-[var(--muted-foreground)] mb-2">Overview</div>
                        <div className="space-y-2">
                            <div><strong>Target Muscles:</strong> {exercise.target_muscles?.join(", ") || "—"}</div>
                            <div><strong>Body Parts:</strong> {exercise.body_parts?.join(", ") || "—"}</div>
                            <div><strong>Equipments:</strong> {exercise.equipments?.join(", ") || "—"}</div>
                            <div><strong>Secondary Muscles:</strong> {exercise.secondary_muscles?.join(", ") || "—"}</div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="text-sm font-semibold text-[var(--muted-foreground)] mb-2">Instructions</div>
                        <ul className="list-disc list-inside space-y-1">
                            {exercise.instructions?.length
                                ? exercise.instructions.map((step, idx) => <li key={idx}>{step}</li>)
                                : <li>—</li>}
                        </ul>
                    </div>
                </div>
            </div>
        </ProtectedWrapper>
    );
}
