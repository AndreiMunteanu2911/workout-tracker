import ProtectedWrapper from "@/components/ProtectedWrapper";

export default function DashboardPage() {
    return (
        <ProtectedWrapper>
            <div className="min-w-full">
                <div className="text-3xl font-bold mb-4 ">Dashboard</div>
                <p>Welcome back! Here you will see a summary of your recent workouts.</p>
                {/* TODO: Add summary stats or charts */}
            </div>
        </ProtectedWrapper>

    );
}
