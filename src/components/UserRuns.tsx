"use client";

import { useQuery } from "@tanstack/react-query";
import { ImageGenerationResult } from "./ImageGenerationResult";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { AlertTriangle, Sparkle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns'; // For human-readable dates

// Define the type for a single run based on your schema and API response
interface Run {
    run_id: string;
    createdAt: number | Date; // Can be number (seconds) or Date object
    image_url: string | null;
    inputs: Record<string, any>; // Assuming inputs is an object
    live_status?: string | null;
    progress?: number | null;
}

export function UserRuns() {
    const { data: userRuns, isLoading, error } = useQuery<Run[]> ({
        queryKey: ["userRuns"],
        queryFn: () => fetch("/api/runs").then((res) => {
            if (!res.ok) throw new Error("Failed to fetch runs");
            return res.json();
        }),
        refetchInterval: 10000, // Refetch every 10 seconds or on window focus
    });

    if (isLoading) {
        return (
            <div className="w-full max-w-3xl mx-auto mt-8">
                <Skeleton className="h-10 w-1/3 mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => (
                        <Skeleton key={i} className="h-64 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-3xl mx-auto mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <p>Error loading your previous generations. Please try again later.</p>
                </div>
            </div>
        )
    }

    if (!userRuns || userRuns.length === 0) {
        return (
            <div className="w-full max-w-3xl mx-auto mt-12 text-center text-gray-500">
                <Sparkle size={32} className="mx-auto mb-2" />
                <p>You haven't generated any images yet.</p>
                <p>Start creating to see your history here!</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 space-y-6 pb-16">
            <h2 className="text-2xl font-semibold text-center mb-6">Your Previous Generations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userRuns.map((run) => (
                    <Card key={run.run_id} className="overflow-hidden group relative">
                        <CardHeader className="p-4">
                             <CardTitle className="text-sm truncate" title={run.inputs?.promptText || run.inputs?.input_text || 'Prompt N/A'}>
                                {/* Displaying one of the text inputs as title */}
                                {run.inputs?.promptText || run.inputs?.input_text || 'Unnamed Run'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {run.createdAt ? 
                                    formatDistanceToNow(
                                        typeof run.createdAt === 'number' ? new Date(run.createdAt * 1000) : new Date(run.createdAt),
                                        { addSuffix: true }
                                    ) 
                                    : 'Date N/A'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* If image_url exists from DB, show it. Otherwise, show live result polling. */}
                            {run.image_url ? (
                                <img
                                    src={run.image_url}
                                    alt={`Generated image for run ${run.run_id}`}
                                    className="w-full h-auto object-cover aspect-square"
                                />
                            ) : (
                                <ImageGenerationResult runId={run.run_id} className="aspect-square" />
                            )}
                        </CardContent>
                        {/* Optional: Show inputs on hover, similar to demo */}
                         <div className="absolute inset-0 bg-black/70 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end text-white text-xs overflow-y-auto">
                            {run.inputs && Object.entries(run.inputs).map(([key, value]) => (
                                <div key={key} className="mb-1">
                                    <span className="font-semibold">{key.replace(/_/g, ' ')}:</span>
                                    <span className="ml-1 break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
} 