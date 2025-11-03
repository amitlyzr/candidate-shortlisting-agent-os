
'use client';

import React from 'react';
import { Step } from 'nextstepjs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TourCardProps {
    step: Step;
    currentStep: number;
    totalSteps: number;
    nextStep: () => void;
    prevStep: () => void;
    skipTour?: () => void;
    arrow: React.ReactNode;
}

export const TourCard = ({
    step,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    arrow,
}: TourCardProps) => {
    const handleFinish = async (event: React.MouseEvent<HTMLButtonElement>) => {
        try {
            // Trigger confetti animation
            const rect = event.currentTarget.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            // Create a canvas for confetti with high z-index
            const canvas = document.createElement('canvas');
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);

            const myConfetti = confetti.create(canvas, {
                resize: true,
                useWorker: true,
            });

            // Fire confetti without waiting
            myConfetti({
                particleCount: 100,
                spread: 70,
                startVelocity: 30,
                origin: {
                    x: x / window.innerWidth,
                    y: y / window.innerHeight,
                },
            });

            // Close the tour immediately
            nextStep();

            // Remove canvas after animation completes
            setTimeout(() => {
                if (document.body.contains(canvas)) {
                    document.body.removeChild(canvas);
                }
            }, 3000);
        } catch (error) {
            console.error("Confetti error:", error);
            nextStep(); // Still proceed even if confetti fails
        }
    };

    return (
        <Card className="w-[380px] shadow-xl border-2 gap-2">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {step.icon && <span className="text-2xl">{step.icon}</span>}
                        <span className="text-lg">{step.title}</span>
                    </div>
                    {step.showSkip && skipTour && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mr-2"
                            onClick={skipTour}
                            title="Close tour"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="pb-3">
                <div className="text-sm text-muted-foreground leading-relaxed">
                    {step.content}
                </div>
                {arrow}
            </CardContent>

            <CardFooter className="flex justify-between items-center pt-3 border-t">
                <div className="text-xs text-muted-foreground font-medium">
                    {currentStep + 1} of {totalSteps}
                </div>

                <div className="flex gap-2">
                    {step.showSkip && skipTour && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={skipTour}
                            className="h-8"
                        >
                            Skip Tour
                        </Button>
                    )}

                    {step.showControls && currentStep > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={prevStep}
                            className="h-8 gap-1"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Previous
                        </Button>
                    )}

                    {step.showControls && (
                        currentStep === totalSteps - 1 ? (
                            <Button
                                size="sm"
                                onClick={handleFinish}
                                className="h-8 gap-1"
                            >
                                Finish
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={nextStep}
                                className="h-8 gap-1"
                            >
                                Next
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        )
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};
