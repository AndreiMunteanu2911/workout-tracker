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
                <h1 className="text-3xl font-bold mb-4">{exercise.name}</h1>

                {exercise.gif_url && (
                    <div className="mb-4">
                        <img
                            src={exercise.gif_url}
                            alt={exercise.name}
                            className="rounded-lg max-w-full h-auto"
                        />
                    </div>
                )}

                <div className="mb-2">
                    <strong>Target Muscles:</strong>{" "}
                    {exercise.target_muscles?.join(", ") || "—"}
                </div>

                <div className="mb-2">
                    <strong>Body Parts:</strong> {exercise.body_parts?.join(", ") || "—"}
                </div>

                <div className="mb-2">
                    <strong>Equipments:</strong> {exercise.equipments?.join(", ") || "—"}
                </div>

                <div className="mb-2">
                    <strong>Secondary Muscles:</strong>{" "}
                    {exercise.secondary_muscles?.join(", ") || "—"}
                </div>

                <div className="mb-2">
                    <strong>Instructions:</strong>
                    <ul className="list-disc list-inside">
                        {exercise.instructions?.length
                            ? exercise.instructions.map((step, idx) => <li key={idx}>{step}</li>)
                            : <li>—</li>}
                    </ul>
                </div>
            </div>
        </ProtectedWrapper>
    );
}
