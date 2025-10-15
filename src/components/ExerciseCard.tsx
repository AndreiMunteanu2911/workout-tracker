import Link from "next/link";

export interface Exercise {
    exercise_id: string;
    name: string;
    gif_url?: string | null;
    target_muscles?: string[] | null;
    body_parts?: string[] | null;
    equipments?: string[] | null;
    secondary_muscles?: string[] | null;
    instructions?: string[] | null;
}

interface ExerciseCardProps {
    exercise: Exercise;
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
    return (
        <Link href={`/exercises/${exercise.exercise_id}`}>
            <div className="border rounded-xl p-4 hover:shadow-lg transition cursor-pointer bg-white">
                <div className="text-lg font-semibold mb-2">{exercise.name}</div>
                <div className="text-sm text-gray-600">
                    {exercise.body_parts?.join(", ") || "No body parts listed"}
                </div>
            </div>
        </Link>
    );
}
