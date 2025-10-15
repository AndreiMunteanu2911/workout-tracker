"use client";

import { useState, useEffect } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import supabase from "@/helper/supabaseClient";

interface Exercise {
    exercise_id: string;
    name: string;
    gif_url?: string;
    target_muscles?: string[];
    body_parts?: string[];
    equipments?: string[];
}

interface Set {
    id: string;
    set_number: number;
    reps: number;
    weight: number;
}

interface WorkoutExercise {
    id: string;
    exercise_id: string;
    exercise: Exercise;
    order_index: number;
    sets: Set[];
}

interface Workout {
    id: string;
    name: string;
    workout_date: string;
    created_at: string;
    status: string;
    workout_exercises: WorkoutExercise[];
}

export default function HistoryPage() {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

    useEffect(() => {
        fetchWorkoutHistory();
    }, []);

    const fetchWorkoutHistory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("workouts")
                .select(`
                    *,
                    workout_exercises (
                        *,
                        exercise:exercises (*),
                        sets (*)
                    )
                `)
                .eq("user_id", user.id)
                .eq("status", "completed")
                .order("workout_date", { ascending: false })
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Sort sets within each exercise
            const processedWorkouts = data?.map(workout => ({
                ...workout,
                workout_exercises: workout.workout_exercises
                    .sort((a: { order_index: number; }, b: { order_index: number; }) => a.order_index - b.order_index)
                    .map((we: { sets: any[]; }) => ({
                        ...we,
                        sets: we.sets.sort((a, b) => a.set_number - b.set_number)
                    }))
            })) || [];

            setWorkouts(processedWorkouts);
        } catch (error) {
            console.error("Error fetching workout history:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleWorkoutExpansion = (workoutId: string) => {
        setExpandedWorkoutId(expandedWorkoutId === workoutId ? null : workoutId);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const calculateTotalVolume = (workout: Workout) => {
        let totalVolume = 0;
        workout.workout_exercises.forEach(we => {
            we.sets.forEach(set => {
                totalVolume += set.reps * set.weight;
            });
        });
        return totalVolume.toFixed(1);
    };

    const calculateTotalSets = (workout: Workout) => {
        return workout.workout_exercises.reduce((total, we) => total + we.sets.length, 0);
    };

    if (loading) {
        return (
            <ProtectedWrapper>
                <div className="min-w-full p-4">
                    <div className="text-3xl font-bold mb-6">Workout History</div>
                    <div className="text-gray-500">Loading workout history...</div>
                </div>
            </ProtectedWrapper>
        );
    }

    return (
        <ProtectedWrapper>
            <div className="min-w-full p-4">
                <div className="text-3xl font-bold mb-6">Workout History</div>

                {workouts.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                        No completed workouts yet. Start your first workout to see it here!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workouts.map((workout) => (
                            <div
                                key={workout.id}
                                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Workout Header */}
                                <div
                                    onClick={() => toggleWorkoutExpansion(workout.id)}
                                    className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold mb-1">
                                                {workout.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {formatDate(workout.workout_date)}
                                            </p>
                                            <div className="flex gap-4 text-sm text-gray-700">
                                                <span>
                                                    <strong>{workout.workout_exercises.length}</strong> exercises
                                                </span>
                                                <span>
                                                    <strong>{calculateTotalSets(workout)}</strong> sets
                                                </span>
                                                <span>
                                                    <strong>{calculateTotalVolume(workout)}</strong> kg total volume
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">

                                            <span className="text-2xl text-gray-400">
                                                {expandedWorkoutId === workout.id ? "−" : "+"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Workout Details (Expanded) */}
                                {expandedWorkoutId === workout.id && (
                                    <div className="p-4 bg-white space-y-4">
                                        {workout.workout_exercises.map((workoutExercise, idx) => (
                                            <div key={workoutExercise.id} className="border-l-4 border-blue-500 pl-4">
                                                <h4 className="text-lg font-semibold mb-2">
                                                    {idx + 1}. {workoutExercise.exercise.name}
                                                </h4>

                                                {workoutExercise.exercise.target_muscles &&
                                                    workoutExercise.exercise.target_muscles.length > 0 && (
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            Target: {workoutExercise.exercise.target_muscles.join(", ")}
                                                        </p>
                                                    )}

                                                {/* Sets Table */}
                                                <div className="mt-2">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left font-medium">Set</th>
                                                            <th className="px-3 py-2 text-left font-medium">Reps</th>
                                                            <th className="px-3 py-2 text-left font-medium">Weight (kg)</th>
                                                            <th className="px-3 py-2 text-left font-medium">Volume (kg)</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {workoutExercise.sets.map((set) => (
                                                            <tr key={set.id} className="border-t">
                                                                <td className="px-3 py-2">{set.set_number}</td>
                                                                <td className="px-3 py-2">{set.reps}</td>
                                                                <td className="px-3 py-2">{set.weight}</td>
                                                                <td className="px-3 py-2 font-medium">
                                                                    {(set.reps * set.weight).toFixed(1)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {/* Exercise Total */}
                                                        <tr className="border-t bg-gray-50 font-semibold">
                                                            <td className="px-3 py-2" colSpan={3}>
                                                                Exercise Total
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                {workoutExercise.sets
                                                                    .reduce((sum, set) => sum + (set.reps * set.weight), 0)
                                                                    .toFixed(1)} kg
                                                            </td>
                                                        </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ProtectedWrapper>
    );
}