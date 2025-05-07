"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WandSparklesIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { useState, FormEvent, ChangeEvent, useRef } from "react";
import { toast } from "sonner";
import { ImageGenerationResult } from "./ImageGenerationResult";
import { useQueryClient } from "@tanstack/react-query";
import Image from 'next/image'; // For preview

export function PodWorkflowApp() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [base64LogoDataUrl, setBase64LogoDataUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [promptText, setPromptText] = useState<string>("Alone in the frame minimalist product shot of a Black baseball cap.");
    const [imageSize, setImageSize] = useState<string>("768");
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [currentRunId, setCurrentRunId] = useState<string | null>(null);
    const queryClientHook = useQueryClient();

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setIsUploading(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBase64LogoDataUrl(reader.result as string);
                setIsUploading(false);
                toast.success("Logo selected: " + file.name);
            };
            reader.onerror = () => {
                setIsUploading(false);
                toast.error("Failed to read file.");
            }
            reader.readAsDataURL(file);
        }
    };

    const clearLogoSelection = () => {
        setSelectedFile(null);
        setBase64LogoDataUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!base64LogoDataUrl) { // Check for base64 data URL now
            toast.error("Please select a logo image.");
            return;
        }
        setIsLoading(true);
        setCurrentRunId(null);

        try {
            const response = await fetch("/api/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ logoUrl: base64LogoDataUrl, promptText, imageSize }), // Send base64 data
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(`Error: ${errorData.error || "Failed to start generation."}`);
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            if (data.run_id) {
                setCurrentRunId(data.run_id);
                toast.success("Generation started! Run ID: " + data.run_id);
                queryClientHook.invalidateQueries({ queryKey: ["userRuns"] });
            } else {
                toast.error("Failed to get Run ID from server.");
            }
        } catch (error: any) {
            toast.error(`An unexpected error occurred: ${error.message}`);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>POD Workflow Generator</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="logoFile">Logo Image</Label>
                            <div className="mt-1 flex items-center space-x-2">
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading || !!base64LogoDataUrl}
                                >
                                    <UploadCloudIcon className="mr-2 h-4 w-4" />
                                    {isUploading ? "Uploading..." : (base64LogoDataUrl ? "Change Logo" : "Upload Logo")}
                                </Button>
                                <input 
                                    id="logoFile" 
                                    type="file" 
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleFileChange}
                                    className="hidden" // Hide the default input
                                    ref={fileInputRef}
                                />
                                {base64LogoDataUrl && (
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={clearLogoSelection}
                                        title="Clear selection"
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {base64LogoDataUrl && (
                                <div className="mt-4 p-2 border rounded-md w-32 h-32 relative overflow-hidden">
                                    <Image src={base64LogoDataUrl} alt="Logo preview" layout="fill" objectFit="contain" />
                                </div>
                            )}
                            {selectedFile && !base64LogoDataUrl && isUploading && <p className="text-sm text-muted-foreground mt-1">Processing image...</p>}
                        </div>

                        <div>
                            <Label htmlFor="promptText">Prompt</Label>
                            <Input
                                id="promptText"
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                placeholder="Enter your prompt"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="imageSize">Image Size (Square)</Label>
                            <Select value={imageSize} onValueChange={setImageSize}>
                                <SelectTrigger id="imageSize" className="w-full">
                                    <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="512">512x512</SelectItem>
                                    <SelectItem value="768">768x768</SelectItem>
                                    <SelectItem value="1024">1024x1024</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading || isUploading}
                            className="w-full"
                        >
                            {isLoading ? "Generating..." : (<><WandSparklesIcon className="mr-2 h-4 w-4" /> Generate Image</>)}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {currentRunId && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Generation Result (Run ID: {currentRunId})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ImageGenerationResult runId={currentRunId} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 