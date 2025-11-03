'use client';

import { NextStepProvider, NextStep } from 'nextstepjs';
import { steps } from '@/lib/steps';
import { useTheme } from "next-themes";
import { TourCard } from '../tour-card';

export function TourWrapper({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <NextStepProvider>
            <NextStep
                steps={steps}
                cardComponent={TourCard}
                shadowRgb={isDark ? "255, 255, 255" : "0, 0, 0"}
                shadowOpacity={isDark ? "0.15" : "0.5"}
            >
                {children}
            </NextStep>
        </NextStepProvider>
    );
}