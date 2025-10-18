// components/ui/LoadingSpinner.tsx
// Animated loading spinner with customizable size

interface LoadingSpinnerProps {
    size?: number; // spinner size in Tailwind units (default: 8)
    className?: string; // additional CSS classes
}

export default function LoadingSpinner({ size = 8, className = "" }: LoadingSpinnerProps) {
    const h = `h-${size}`;
    const w = `w-${size}`;

    return (
        <div className={`flex items-center justify-center ${className}`}>
            {/* Animated spinning circle with theme colors */}
            <div
                className={`animate-spin rounded-full ${h} ${w} border-4 border-t-white border-b-white border-l-white border-r-white`}
                style={{ borderTopColor: "var(--color-primary)" }}
            ></div>
            <span className="ml-6 text-[color:var(--primary-500)] font-semibold">Loading...</span>
        </div>
    );
}
