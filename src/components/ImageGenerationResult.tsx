"use client";

import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
// Make sure findOutputImageById is consistent with webhook or make it a shared lib
import { findOutputImageById } from "@/lib/findOutputImage"; // We'll create this
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion"; // If you want animations
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";


export function ImageGenerationResult({
    runId,
    className,
}: { runId: string } & React.ComponentProps<"div">) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState<string>("preparing");
    const [currentProgress, setCurrentProgress] = useState<number | undefined>();
    const [liveGenerationStatus, setLiveGenerationStatus] = useState<string | null>(null);
    const [isTerminalStatus, setIsTerminalStatus] = useState(false);
    const [queuePos, setQueuePos] = useState<number | null>(null);

    const { data: runDetails, isLoading: isLoadingDetails } = useQuery({
        queryKey: ["runDetails", runId],
        queryFn: async () => {
            const res = await fetch(`/api/run/${runId}`);
            if (!res.ok) {
                // Consider how to handle errors, maybe show in UI
                console.error("Failed to fetch run details");
                // throw new Error("Failed to fetch run details");
                return null; // Or some error state
            }
            return res.json();
        },
        refetchInterval: (query) => {
            // Stop refetching if we have a final image or terminal status
            const data: any = query.state.data;
            if (data?.status === "success" && findOutputImageById(data.outputs, "final_result")) return false;
            if (["failed", "success", "cancelled", "timeout"].includes(data?.status)) return false;
            return 2000; // Poll every 2 seconds
        },
        enabled: !!runId && !isTerminalStatus, // Only run query if runId exists and not in terminal state
    });

    useEffect(() => {
        if (runDetails) {
            setCurrentStatus(runDetails.status);
            setCurrentProgress(runDetails.progress);
            setLiveGenerationStatus(runDetails.live_status ?? null);
            setQueuePos(runDetails.queue_position);

            // Check for intermediate image (if your workflow provides one with a specific ID)
            const intermediate = findOutputImageById(runDetails.outputs, "intermediate_result"); // Example ID
            if (intermediate) setPreviewImageUrl(intermediate);

            if (runDetails.status === "success") {
                const finalImg = findOutputImageById(runDetails.outputs, "343") || 
                                 findOutputImageById(runDetails.outputs, "final_result") || 
                                 findOutputImageById(runDetails.outputs, "8"); 
                if (finalImg) {
                    setImageUrl(finalImg);
                    setIsTerminalStatus(true);
                } else if (runDetails.outputs?.length > 0) {
                    console.warn("Run successful, but expected output image not found. Outputs received:", JSON.stringify(runDetails.outputs, null, 2));
                    setIsTerminalStatus(true);
                }
            } else if (["failed", "cancelled", "timeout"].includes(runDetails.status)) {
                setIsTerminalStatus(true);
            }
        }
    }, [runDetails]);

    if (!runId) return null;

    if (isLoadingDetails && !runDetails) {
        return <Skeleton className={cn("w-full aspect-square relative", className)} />;
    }

    if (imageUrl) {
        return (
            <AnimatePresence mode="wait">
                <motion.img
                    key="final"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className={cn("z-10 w-full h-auto object-contain rounded-md", className)}
                    src={imageUrl}
                    alt="Generated output"
                />
            </AnimatePresence>
        );
    }

    return (
        <div
            className={cn(
                "w-full aspect-square relative bg-muted rounded-md flex flex-col items-center justify-center p-4 overflow-hidden",
                className,
            )}
        >
            {previewImageUrl && (
                 <div className="absolute inset-0 z-0">
                    <motion.img
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full object-cover scale-110"
                        src={previewImageUrl}
                        alt="Preview"
                    />
                    <div className="absolute inset-0 backdrop-blur-md" />
                </div>
            )}

            <div className="z-10 flex flex-col items-center justify-center gap-2 text-center">
                {queuePos !== null && queuePos > 0 && (
                     <div className="text-xs bg-black/70 text-white px-3 py-1 rounded-full shadow-md mb-2">
                        Queue Position: {queuePos} <LoaderCircle size={12} className="inline animate-spin ml-1" />
                    </div>
                )}
                {(queuePos === null || queuePos === 0) && (
                    <>
                        <div className="flex items-center justify-center gap-2 text-sm sm:text-base">
                            {liveGenerationStatus || currentStatus}{" "}
                            <LoaderCircle size={16} className="animate-spin" />
                        </div>
                        <Progress value={(currentProgress !== undefined ? currentProgress : 0) * 100} className="h-2 w-full max-w-[200px]" />
                        {currentProgress !== undefined && (
                            <span className="text-xs text-muted-foreground">
                                {Math.round(currentProgress * 100)}%
                            </span>
                        )}
                    </>
                )}
                {isTerminalStatus && currentStatus !== "success" && (
                    <p className="text-red-500 font-semibold mt-2">Run {currentStatus}.</p>
                )}
            </div>
        </div>
    );
} 