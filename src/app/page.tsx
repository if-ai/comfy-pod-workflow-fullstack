import { PodWorkflowApp } from "@/components/PodWorkflowApp";
import { UserRuns } from "@/components/UserRuns";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { ExternalLink, LogIn } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-50">
            <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <Link href="/" className="font-bold text-lg">
                        POD Workflow Demo
                    </Link>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://github.com/comfy-deploy/comfydeploy-fullstack-demo" // Update if you have a new repo
                            >
                                <ExternalLink className="mr-2 h-4 w-4" /> GitHub
                            </Link>
                        </Button>
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <Button size="sm">
                                    <LogIn className="mr-2 h-4 w-4" /> Sign In
                                </Button>
                            </SignInButton>
                        </SignedOut>
                    </div>
                </div>
            </nav>

            <main className="flex-grow container w-full py-8 px-4">
                <SignedOut>
                    <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-10rem)]">
                        <h1 className="text-4xl font-bold mb-4">Welcome to the POD Workflow Demo!</h1>
                        <p className="text-lg text-muted-foreground mb-8">
                            Sign in to generate product mockups with your logo.
                        </p>
                        <SignInButton mode="modal">
                            <Button size="lg">Get Started & Sign In</Button>
                        </SignInButton>
                    </div>
                </SignedOut>

                <SignedIn>
                    <div className="w-full flex flex-col items-center gap-12">
                        <PodWorkflowApp />
                        <Suspense fallback={<Skeleton className="w-full max-w-3xl h-[300px]" />}>
                            <UserRuns />
                        </Suspense>
                    </div>
                </SignedIn>
            </main>

            <footer className="py-6 md:px-8 md:py-0 border-t bg-background">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built with Next.js, ComfyDeploy, Clerk, Drizzle & Shadcn/UI.
                    </p>
                </div>
            </footer>
        </div>
    );
}
