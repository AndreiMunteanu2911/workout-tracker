"use client";

import { useState, useEffect } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import Button from "@/components/Button";
import supabase from "@/helper/supabaseClient";

interface Exercise {
    exercise_id: string;
    name: string;
    gif_url?: string;
    target_muscles?: string[];
    body_parts?: string[];
    equipments?: string[];
}

interface WorkoutExercise {
    id: string;
    exercise_id: string;
    exercise: Exercise;
    order_index: number;
    sets: Set[];
}

interface Set {
    id: string;
    set_number: number;
    reps: number;
    weight: number;
}

export default function WorkoutPage() {
    const [workoutStarted, setWorkoutStarted] = useState(false);
    const [workoutName, setWorkoutName] = useState("My Workout");
    const [workoutId, setWorkoutId] = useState<string | null>(null);
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [draftWorkout, setDraftWorkout] = useState<any>(null);

    // Exercise search
    const [showExerciseSearch, setShowExerciseSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Exercise[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Check for draft workout on mount
    useEffect(() => {
        const checkForDraftWorkout = async () => {
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
                    .eq("status", "draft")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (error && error.code !== "PGRST116") throw error;

                if (data) {
                    setDraftWorkout(data);
                    setShowResumePrompt(true);
                }
            } catch (error) {
                console.error("Error checking for draft workout:", error);
            }
        };

        checkForDraftWorkout();
    }, []);

    // Resume draft workout
    const resumeDraftWorkout = () => {
        if (!draftWorkout) return;

        setWorkoutId(draftWorkout.id);
        setWorkoutName(draftWorkout.name);

        // Transform the data structure
        const exercises = draftWorkout.workout_exercises.map((we: any) => ({
            id: we.id,
            exercise_id: we.exercise_id,
            exercise: we.exercise,
            order_index: we.order_index,
            sets: we.sets.sort((a: any, b: any) => a.set_number - b.set_number),
        }));

        setWorkoutExercises(exercises);
        setWorkoutStarted(true);
        setShowResumePrompt(false);
        setDraftWorkout(null);
    };

    // Discard draft workout
    const discardDraftWorkout = async () => {
        if (!draftWorkout) return;

        try {
            await supabase
                .from("workouts")
                .delete()
                .eq("id", draftWorkout.id);

            setShowResumePrompt(false);
            setDraftWorkout(null);
        } catch (error) {
            console.error("Error discarding draft workout:", error);
        }
    };

    // Auto-save workout data (debounced)
    useEffect(() => {
        if (!workoutStarted || !workoutId) return;

        const autoSave = setTimeout(async () => {
            await saveWorkoutToDB();
        }, 2000); // Save 2 seconds after last change

        return () => clearTimeout(autoSave);
    }, [workoutExercises, workoutStarted, workoutId]);

    // Save workout data to database
    const saveWorkoutToDB = async () => {
        if (!workoutId) return;

        try {
            // Update workout name
            await supabase
                .from("workouts")
                .update({ name: workoutName })
                .eq("id", workoutId);

            // Update all sets
            for (const exercise of workoutExercises) {
                for (const set of exercise.sets) {
                    await supabase
                        .from("sets")
                        .update({
                            reps: set.reps,
                            weight: set.weight,
                        })
                        .eq("id", set.id);
                }
            }
        } catch (error) {
            console.error("Error auto-saving workout:", error);
        }
    };

    // Search exercises as user types
    useEffect(() => {
        const searchExercises = async () => {
            if (searchQuery.trim() === "") {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const { data, error } = await supabase
                    .from("exercises")
                    .select("*")
                    .ilike("name", `%${searchQuery}%`)
                    .limit(10);

                if (error) throw error;
                setSearchResults(data || []);
            } catch (error) {
                console.error("Error searching exercises:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(searchExercises, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    // Start a new workout
    const startWorkout = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("workouts")
                .insert({
                    user_id: user.id,
                    workout_date: new Date().toISOString().split('T')[0],
                    name: workoutName,
                    status: "draft",
                })
                .select()
                .single();

            if (error) throw error;

            setWorkoutId(data.id);
            setWorkoutStarted(true);
        } catch (error) {
            console.error("Error starting workout:", error);
            alert("Failed to start workout");
        }
    };

    // Finish workout (marks as completed)
    const finishWorkout = async () => {
        if (!workoutId) return;

        try {
            // Final save
            await saveWorkoutToDB();

            // Mark workout as completed
            const { error } = await supabase
                .from("workouts")
                .update({ status: "completed" })
                .eq("id", workoutId);

            if (error) throw error;

            // Reset state
            setWorkoutStarted(false);
            setWorkoutId(null);
            setWorkoutExercises([]);
            setWorkoutName("My Workout");
        } catch (error) {
            console.error("Error finishing workout:", error);
            alert("Failed to finish workout");
        }
    };

    // Cancel workout (deletes everything)
    const cancelWorkout = async () => {
        if (!workoutId) return;

        const confirmed = confirm("Are you sure you want to cancel this workout? All data will be lost.");
        if (!confirmed) return;

        try {
            // Delete the workout (cascade will handle workout_exercises and sets)
            const { error } = await supabase
                .from("workouts")
                .delete()
                .eq("id", workoutId);

            if (error) throw error;

            setWorkoutStarted(false);
            setWorkoutId(null);
            setWorkoutExercises([]);
            setWorkoutName("My Workout");
        } catch (error) {
            console.error("Error canceling workout:", error);
            alert("Failed to cancel workout");
        }
    };

    // Add exercise to workout
    const addExerciseToWorkout = async (exercise: Exercise) => {
        if (!workoutId) return;

        try {
            // Add workout exercise
            const { data: workoutExerciseData, error: exerciseError } = await supabase
                .from("workout_exercises")
                .insert({
                    workout_id: workoutId,
                    exercise_id: exercise.exercise_id,
                    order_index: workoutExercises.length,
                })
                .select()
                .single();

            if (exerciseError) throw exerciseError;

            // Add default set
            const { data: setData, error: setError } = await supabase
                .from("sets")
                .insert({
                    workout_exercise_id: workoutExerciseData.id,
                    set_number: 1,
                    reps: 0,
                    weight: 0,
                })
                .select()
                .single();

            if (setError) throw setError;

            setWorkoutExercises([
                ...workoutExercises,
                {
                    id: workoutExerciseData.id,
                    exercise_id: exercise.exercise_id,
                    exercise: exercise,
                    order_index: workoutExerciseData.order_index,
                    sets: [setData],
                },
            ]);

            setShowExerciseSearch(false);
            setSearchQuery("");
            setSearchResults([]);
        } catch (error) {
            console.error("Error adding exercise:", error);
            alert("Failed to add exercise");
        }
    };

    // Add set to specific exercise
    const addSetToExercise = async (exerciseIndex: number) => {
        const workoutExercise = workoutExercises[exerciseIndex];
        const setNumber = workoutExercise.sets.length + 1;

        try {
            const { data, error } = await supabase
                .from("sets")
                .insert({
                    workout_exercise_id: workoutExercise.id,
                    set_number: setNumber,
                    reps: 0,
                    weight: 0,
                })
                .select()
                .single();

            if (error) throw error;

            const updatedExercises = [...workoutExercises];
            updatedExercises[exerciseIndex] = {
                ...updatedExercises[exerciseIndex],
                sets: [...updatedExercises[exerciseIndex].sets, data],
            };
            setWorkoutExercises(updatedExercises);
        } catch (error) {
            console.error("Error adding set:", error);
            alert("Failed to add set");
        }
    };

    // Update set values (local state only - no immediate DB call)
    const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
        const updatedExercises = [...workoutExercises];
        updatedExercises[exerciseIndex].sets[setIndex] = {
            ...updatedExercises[exerciseIndex].sets[setIndex],
            [field]: value,
        };
        setWorkoutExercises(updatedExercises);
        // DB update happens via debounced auto-save useEffect
    };

    // Delete a specific set
    const deleteSet = async (exerciseIndex: number, setIndex: number) => {
        const set = workoutExercises[exerciseIndex].sets[setIndex];

        try {
            const { error } = await supabase
                .from("sets")
                .delete()
                .eq("id", set.id);

            if (error) throw error;

            const updatedExercises = [...workoutExercises];
            updatedExercises[exerciseIndex].sets.splice(setIndex, 1);

            // Renumber remaining sets
            updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.map((s, idx) => ({
                ...s,
                set_number: idx + 1
            }));

            setWorkoutExercises(updatedExercises);
        } catch (error) {
            console.error("Error deleting set:", error);
            alert("Failed to delete set");
        }
    };

    // Delete an entire exercise
    const deleteExercise = async (exerciseIndex: number) => {
        const workoutExercise = workoutExercises[exerciseIndex];

        try {
            const { error } = await supabase
                .from("workout_exercises")
                .delete()
                .eq("id", workoutExercise.id);

            if (error) throw error;

            const updatedExercises = [...workoutExercises];
            updatedExercises.splice(exerciseIndex, 1);
            setWorkoutExercises(updatedExercises);
        } catch (error) {
            console.error("Error deleting exercise:", error);
            alert("Failed to delete exercise");
        }
    };

    return (
        <ProtectedWrapper>
            <div className="min-w-full p-4">
                {/* Resume Draft Workout Prompt */}
                {showResumePrompt && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold mb-4">Resume Workout?</h3>
                            <p className="mb-6 text-gray-700">
                                You have an unfinished workout. Would you like to resume it or start fresh?
                            </p>
                            <div className="flex gap-3">
                                <Button onClick={resumeDraftWorkout} className="flex-1">
                                    Resume
                                </Button>
                                <button
                                    onClick={discardDraftWorkout}
                                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    Discard
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-6">
                    <div className="text-3xl font-bold">Workout</div>
                    {!workoutStarted ? (
                        <Button onClick={startWorkout}>New Workout</Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button onClick={cancelWorkout}>Cancel Workout</Button>
                            <Button onClick={finishWorkout}>Finish Workout</Button>
                        </div>
                    )}
                </div>

                {workoutStarted && (
                    <div className="space-y-4 mt-4">
                        {/* Workout Name */}
                        <div>
                            <label className="block mb-1 text-sm font-medium">Workout Name</label>
                            <input
                                type="text"
                                value={workoutName}
                                onChange={(e) => setWorkoutName(e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                            />
                        </div>

                        {/* Add Exercise Button */}
                        <div>
                            <Button onClick={() => setShowExerciseSearch(true)}>
                                Add Exercise
                            </Button>
                        </div>

                        {/* Exercise Search Modal */}
                        {showExerciseSearch && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                                    <h3 className="text-xl font-bold mb-4">Search Exercises</h3>
                                    <input
                                        type="text"
                                        placeholder="Type to search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="border rounded px-3 py-2 w-full mb-4"
                                        autoFocus
                                    />

                                    {isSearching && <p className="text-gray-500">Searching...</p>}

                                    <div className="space-y-2">
                                        {searchResults.map((exercise) => (
                                            <div
                                                key={exercise.exercise_id}
                                                onClick={() => addExerciseToWorkout(exercise)}
                                                className="p-3 border rounded hover:bg-gray-100 cursor-pointer"
                                            >
                                                <div className="font-medium">{exercise.name}</div>
                                                {exercise.target_muscles && exercise.target_muscles.length > 0 && (
                                                    <div className="text-sm text-gray-600">
                                                        {exercise.target_muscles.join(", ")}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={() => {
                                            setShowExerciseSearch(false);
                                            setSearchQuery("");
                                            setSearchResults([]);
                                        }}
                                        className="mt-4 w-full"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Exercises List */}
                        <div className="space-y-6">
                            {workoutExercises.map((workoutExercise, exerciseIndex) => (
                                <div key={workoutExercise.id} className="border rounded p-4">
                                    <h3 className="text-lg font-semibold mb-3">
                                        {workoutExercise.exercise.name}
                                    </h3>

                                    {/* Sets */}
                                    <div className="space-y-2 mb-3">
                                        {workoutExercise.sets.map((set, setIndex) => (
                                            <div key={set.id} className="flex gap-2 items-center">
                                                <span className="font-medium w-16">Set {set.set_number}:</span>
                                                <input
                                                    type="number"
                                                    placeholder="Reps"
                                                    value={set.reps || ""}
                                                    onChange={(e) =>
                                                        updateSet(exerciseIndex, setIndex, "reps", parseInt(e.target.value) || 0)
                                                    }
                                                    className="border rounded px-2 py-1 w-20"
                                                />
                                                <span className="text-sm">reps</span>
                                                <input
                                                    type="number"
                                                    placeholder="Weight"
                                                    value={set.weight || ""}
                                                    onChange={(e) =>
                                                        updateSet(exerciseIndex, setIndex, "weight", parseFloat(e.target.value) || 0)
                                                    }
                                                    className="border rounded px-2 py-1 w-24"
                                                    step="0.5"
                                                />
                                                <span className="text-sm">kg</span>
                                                <button
                                                    onClick={() => deleteSet(exerciseIndex, setIndex)}
                                                    className="ml-2 text-red-600 hover:text-red-800 font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Set and Delete Exercise Buttons */}
                                    <div className="flex gap-2">
                                        <Button onClick={() => addSetToExercise(exerciseIndex)}>
                                            Add Set
                                        </Button>
                                        <button
                                            onClick={() => deleteExercise(exerciseIndex)}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
                                        >
                                            Delete Exercise
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ProtectedWrapper>
    );
}