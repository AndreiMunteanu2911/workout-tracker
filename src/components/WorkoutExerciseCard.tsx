import Button from "./Button";

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

interface ExerciseCardProps {
    workoutExercise: WorkoutExercise;
    exerciseIndex: number;
    onAddSet: (exerciseIndex: number) => void;
    onUpdateSet: (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => void;
    onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
    onDeleteExercise: (exerciseIndex: number) => void;
    errorMessage: string;
    setErrorMessage: (message: string) => void;
}

export default function WorkoutExerciseCard({
                                                workoutExercise,
                                                exerciseIndex,
                                                onAddSet,
                                                onUpdateSet,
                                                onDeleteSet,
                                                onDeleteExercise,
                                                errorMessage,
                                                setErrorMessage,
                                            }: ExerciseCardProps) {
    return (
        <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-3">{workoutExercise.exercise.name}</h3>
            {errorMessage && (
                <div className="mb-3 text-red-600 text-sm">{errorMessage}</div>
            )}
            <div className="space-y-2 mb-3">
                {workoutExercise.sets.map((set, setIndex) => (
                    <div key={set.id} className="flex gap-2 items-center">
                        <span className="font-medium w-16">Set {set.set_number}:</span>
                        <input
                            type="number"
                            placeholder="Reps"
                            value={set.reps || ""}
                            onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                onUpdateSet(exerciseIndex, setIndex, "reps", value);
                                setErrorMessage("");
                            }}
                            className="border rounded px-2 py-1 w-20"
                            min="0"
                        />
                        <span className="text-sm">reps</span>
                        <input
                            type="number"
                            placeholder="Weight"
                            value={set.weight || ""}
                            onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                onUpdateSet(exerciseIndex, setIndex, "weight", value);
                                setErrorMessage("");
                            }}
                            className="border rounded px-2 py-1 w-24"
                            min="0"
                            step="0.5"
                        />
                        <span className="text-sm">kg</span>
                        <button
                            onClick={() => onDeleteSet(exerciseIndex, setIndex)}
                            className="ml-2 text-red-600 hover:text-red-800 font-bold"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <Button onClick={() => onAddSet(exerciseIndex)}>Add Set</Button>
                <button
                    onClick={() => onDeleteExercise(exerciseIndex)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
                >
                    Delete Exercise
                </button>
            </div>
        </div>
    );
}