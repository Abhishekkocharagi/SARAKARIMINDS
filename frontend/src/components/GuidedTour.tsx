'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface Step {
    targetId: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
    steps: Step[];
    onComplete: () => void;
    isVisible: boolean;
}

export default function GuidedTour({ steps, onComplete, isVisible }: GuidedTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isVisible && steps[currentStep]) {
            const updateRect = () => {
                const element = document.getElementById(steps[currentStep].targetId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // Only update if rect actually has dimensions (not hidden)
                    if (rect.width > 0 && rect.height > 0) {
                        setTargetRect(rect);
                    } else {
                        setTargetRect(null);
                    }
                } else {
                    setTargetRect(null);
                }
            };

            updateRect();
            interval = setInterval(updateRect, 500); // Check every 500ms for dynamic elements
            window.addEventListener('scroll', updateRect);
            window.addEventListener('resize', updateRect);

            return () => {
                if (interval) clearInterval(interval);
                window.removeEventListener('scroll', updateRect);
                window.removeEventListener('resize', updateRect);
            };
        }
    }, [currentStep, isVisible, steps]);

    if (!isVisible) return null;

    const step = steps[currentStep];

    const getTooltipStyles = () => {
        if (!targetRect) {
            // Center tooltip if target is missing
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                position: 'fixed'
            } as const;
        }

        const gap = 15;
        if (step.position === 'top') {
            return {
                bottom: window.innerHeight - targetRect.top + gap,
                left: targetRect.left + targetRect.width / 2,
                transform: 'translateX(-50%)'
            };
        }
        if (step.position === 'bottom') {
            return {
                top: targetRect.bottom + gap,
                left: targetRect.left + targetRect.width / 2,
                transform: 'translateX(-50%)'
            };
        }
        if (step.position === 'left') {
            return {
                top: targetRect.top + targetRect.height / 2,
                right: window.innerWidth - targetRect.left + gap,
                transform: 'translateY(-50%)'
            };
        }
        if (step.position === 'right') {
            return {
                top: targetRect.top + targetRect.height / 2,
                left: targetRect.right + gap,
                transform: 'translateY(-50%)'
            };
        }
        return {};
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Overlay with Cutout */}
            {targetRect && (
                <div
                    className="absolute inset-0 bg-black/50 transition-all duration-500"
                    style={{
                        clipPath: `polygon(
                            0% 0%, 0% 100%, 
                            ${targetRect.left}px 100%, 
                            ${targetRect.left}px ${targetRect.top}px, 
                            ${targetRect.right}px ${targetRect.top}px, 
                            ${targetRect.right}px ${targetRect.bottom}px, 
                            ${targetRect.left}px ${targetRect.bottom}px, 
                            ${targetRect.left}px 100%, 
                            100% 100%, 100% 0%
                        )`
                    }}
                />
            )}
            {!targetRect && <div className="absolute inset-0 bg-black/50" />}

            {/* Tooltip */}
            <div
                className="absolute bg-white p-6 rounded-2xl shadow-2xl w-64 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
                style={getTooltipStyles() as any}
            >
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded">
                            STEP {currentStep + 1}/{steps.length}
                        </span>
                        <button onClick={onComplete} className="text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-widest">Skip</button>
                    </div>
                    <p className="text-sm font-bold text-gray-800 leading-relaxed">
                        {step.content}
                    </p>
                    <button
                        onClick={handleNext}
                        className="w-full py-3 bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-lg shadow-blue-500/20"
                    >
                        {currentStep === steps.length - 1 ? 'Finish tour' : 'Next Step →'}
                    </button>
                </div>

                {/* Arrow */}
                {targetRect && (
                    <div
                        className={`absolute w-3 h-3 bg-white rotate-45 transform ${step.position === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2' :
                                step.position === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2' :
                                    step.position === 'left' ? '-right-1.5 top-1/2 -translate-y-1/2' :
                                        '-left-1.5 top-1/2 -translate-y-1/2'
                            }`}
                    />
                )}
            </div>

            {/* Hand Pointer Animation */}
            {targetRect && (
                <div
                    className="absolute transition-all duration-500 pointer-events-none"
                    style={{
                        top: targetRect.top + targetRect.height / 2,
                        left: targetRect.left + targetRect.width / 2,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="w-12 h-12 bg-blue-600/20 rounded-full animate-ping absolute inset-0" />
                    <div className="w-4 h-4 bg-blue-600 rounded-full absolute inset-4 border-2 border-white shadow-lg" />
                </div>
            )}
        </div>
    );
}
