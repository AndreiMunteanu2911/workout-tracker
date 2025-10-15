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
            <div className="border rounded-sm p-4 transition cursor-pointer bg-white hover:shadow-md hover:border-[var(--primary-200)]">
                <div className="text-lg font-semibold mb-1 text-[var(--color-foreground)]">{exercise.name}</div>
                <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{exercise.body_parts?.join(", ") || "No body parts listed"}</div>
            </div>
        </Link>
    );
}
