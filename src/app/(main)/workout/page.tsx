'use client'

import { useState, useEffect } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import supabase from "@/helper/supabaseClient";
import ExerciseCard from "@/components/WorkoutExerciseCard";
import ExerciseSearchModal from "@/components/ExerciseSearchModal";
import ResumeDraftPrompt from "@/components/ResumeDraftPrompt";
import Button from "@/components/Button";

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

interface DraftWorkout {
    id: string;
    name: string;
    workout_date: string;
    workout_exercises: {
        id: string;
        exercise_id: string;
        exercise: Exercise;
        order_index: number;
        sets: Set[];
    }[];
}

export default function WorkoutPage() {
    const [workoutStarted, setWorkoutStarted] = useState(false);
    const [workoutName, setWorkoutName] = useState("My Workout");
    const [workoutId, setWorkoutId] = useState<string | null>(null);
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [draftWorkout, setDraftWorkout] = useState<DraftWorkout | null>(null);
    const [errorMessages, setErrorMessages] = useState<{ [key: string]: string }>({});

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
                setErrorMessages((prev) => ({ ...prev, general: "Failed to check for draft workout." }));
            }
        };

        checkForDraftWorkout();
    }, []);

    // Auto-save workout data (debounced)
    useEffect(() => {
        if (!workoutStarted || !workoutId) return;

        const autoSave = setTimeout(async () => {
            await saveWorkoutToDB();
        }, 2000);

        return () => clearTimeout(autoSave);
    }, [workoutExercises, workoutStarted, workoutId]);

    // Save workout data to database
    const saveWorkoutToDB = async () => {
        if (!workoutId) return;

        try {
            await supabase
                .from("workouts")
                .update({ name: workoutName })
                .eq("id", workoutId);

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
            setErrorMessages((prev) => ({ ...prev, general: "Failed to auto-save workout." }));
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
                setErrorMessages((prev) => ({ ...prev, search: "Failed to search exercises." }));
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
            setErrorMessages((prev) => ({ ...prev, general: "Failed to start workout." }));
        }
    };

    // Finish workout
    const finishWorkout = async () => {
        if (!workoutId) return;

        try {
            await saveWorkoutToDB();

            const { error } = await supabase
                .from("workouts")
                .update({ status: "completed" })
                .eq("id", workoutId);

            if (error) throw error;

            setWorkoutStarted(false);
            setWorkoutId(null);
            setWorkoutExercises([]);
            setWorkoutName("My Workout");
            setErrorMessages({});
        } catch (error) {
            console.error("Error finishing workout:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to finish workout." }));
        }
    };

    // Cancel workout
    const cancelWorkout = async () => {
        if (!workoutId) return;

        const confirmed = confirm("Are you sure you want to cancel this workout? All data will be lost.");
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from("workouts")
                .delete()
                .eq("id", workoutId);

            if (error) throw error;

            setWorkoutStarted(false);
            setWorkoutId(null);
            setWorkoutExercises([]);
            setWorkoutName("My Workout");
            setErrorMessages({});
        } catch (error) {
            console.error("Error canceling workout:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to cancel workout." }));
        }
    };

    // Resume draft workout
    const resumeDraftWorkout = async () => {
        if (!draftWorkout) return;

        try {
            const { data, error } = await supabase
                .from("workouts")
                .select("id")
                .eq("id", draftWorkout.id)
                .single();

            if (error || !data) {
                setErrorMessages((prev) => ({ ...prev, general: "Draft workout no longer exists." }));
                setShowResumePrompt(false);
                setDraftWorkout(null);
                return;
            }

            setWorkoutId(draftWorkout.id);
            setWorkoutName(draftWorkout.name);

            const exercises = draftWorkout.workout_exercises.map((we) => ({
                id: we.id,
                exercise_id: we.exercise_id,
                exercise: we.exercise,
                order_index: we.order_index,
                sets: we.sets.sort((a, b) => a.set_number - b.set_number),
            }));

            setWorkoutExercises(exercises);
            setWorkoutStarted(true);
            setShowResumePrompt(false);
            setDraftWorkout(null);
            setErrorMessages({});
        } catch (error) {
            console.error("Error resuming draft workout:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to resume draft workout." }));
        }
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
            setErrorMessages({});
        } catch (error) {
            console.error("Error discarding draft workout:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to discard draft workout." }));
        }
    };

    // Add exercise to workout
    const addExerciseToWorkout = async (exercise: Exercise) => {
        if (!workoutId) return;

        try {
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
            setErrorMessages((prev) => ({ ...prev, search: "" }));
        } catch (error) {
            console.error("Error adding exercise:", error);
            setErrorMessages((prev) => ({ ...prev, general: "Failed to add exercise." }));
        }
    };

    // Add set to specific exercise
    const addSetToExercise = async (exerciseIndex: number) => {
        const workoutExercise = workoutExercises[exerciseIndex];
        if (workoutExercise.sets.length >= 10) {
            setErrorMessages((prev) => ({
                ...prev,
                [`exercise-${exerciseIndex}`]: "Maximum 10 sets per exercise.",
            }));
            return;
        }

        try {
            const setNumber = workoutExercise.sets.length + 1;
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
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "" }));
        } catch (error) {
            console.error("Error adding set:", error);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to add set." }));
        }
    };

    // Update set values
    const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
        const errorKey = `exercise-${exerciseIndex}-set-${setIndex}-${field}`;
        if (value < 0) {
            setErrorMessages((prev) => ({
                ...prev,
                [errorKey]: `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be negative.`,
            }));
            return;
        }

        const updatedExercises = [...workoutExercises];
        updatedExercises[exerciseIndex].sets[setIndex] = {
            ...updatedExercises[exerciseIndex].sets[setIndex],
            [field]: value,
        };
        setWorkoutExercises(updatedExercises);
        setErrorMessages((prev) => ({ ...prev, [errorKey]: "" }));
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
            updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.map((s, idx) => ({
                ...s,
                set_number: idx + 1,
            }));

            setWorkoutExercises(updatedExercises);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "" }));
        } catch (error) {
            console.error("Error deleting set:", error);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to delete set." }));
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
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "" }));
        } catch (error) {
            console.error("Error deleting exercise:", error);
            setErrorMessages((prev) => ({ ...prev, [`exercise-${exerciseIndex}`]: "Failed to delete exercise." }));
        }
    };

    return (
        <ProtectedWrapper>
            <div className="min-w-full p-4">
                {errorMessages.general && (
                    <div className="mb-4 text-red-600">{errorMessages.general}</div>
                )}

                <ResumeDraftPrompt
                    show={showResumePrompt}
                    draftWorkout={draftWorkout}
                    onResume={resumeDraftWorkout}
                    onDiscard={discardDraftWorkout}
                />

                {/* Move WorkoutHeader content here, remove WorkoutHeader import and usage */}
                <div className="flex justify-between items-center mb-6">
                    <div className="text-3xl text-gray-700 font-bold">Workout</div>
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
                        <div>
                            <label className="block mb-1 text-sm font-medium">Workout Name</label>
                            <input
                                type="text"
                                value={workoutName}
                                onChange={(e) => setWorkoutName(e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                            />
                        </div>

                        <div>
                            <Button onClick={() => setShowExerciseSearch(true)}>
                                Add Exercise
                            </Button>
                        </div>

                        <ExerciseSearchModal
                            isOpen={showExerciseSearch}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchResults={searchResults}
                            isSearching={isSearching}
                            onClose={() => {
                                setShowExerciseSearch(false);
                                setSearchQuery("");
                                setSearchResults([]);
                                setErrorMessages((prev) => ({ ...prev, search: "" }));
                            }}
                            onSelectExercise={addExerciseToWorkout}
                        />

                        {workoutExercises.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                No exercises added yet. Click "Add Exercise" to start.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {workoutExercises.map((workoutExercise, exerciseIndex) => (
                                    <ExerciseCard
                                        key={workoutExercise.id}
                                        workoutExercise={workoutExercise}
                                        exerciseIndex={exerciseIndex}
                                        onAddSet={addSetToExercise}
                                        onUpdateSet={updateSet}
                                        onDeleteSet={deleteSet}
                                        onDeleteExercise={deleteExercise}
                                        errorMessage={errorMessages[`exercise-${exerciseIndex}`] || ""}
                                        setErrorMessage={(message: string) =>
                                            setErrorMessages((prev) => ({
                                                ...prev,
                                                [`exercise-${exerciseIndex}`]: message,
                                            }))
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ProtectedWrapper>
    );
}