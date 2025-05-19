
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressGradient from './ProgressGradient';

type Stage = {
  subtitle: string;
  targetPercentage: number;
};

const stages: Stage[] = [
  { subtitle: "Doing something at stage 1", targetPercentage: 33 },
  { subtitle: "Stage 2 now", targetPercentage: 66 },
  { subtitle: "3rd & final stage!!11eleven", targetPercentage: 100 },
];

const MiningCard = () => {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isInitialProgress, setIsInitialProgress] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);

  const getCurrentStageIndex = (percentage: number): number => {
    if (percentage >= stages[2].targetPercentage) return 2;
    if (percentage >= stages[1].targetPercentage) return 2;  // Changed to return stage 2 (index 2) at 66%
    if (percentage >= stages[0].targetPercentage) return 1;
    return 0;
  };

  const clearCurrentInterval = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const calculateIncrement = (currentProgress: number) => {
    const currentStageIndex = getCurrentStageIndex(currentProgress);
    const stage = stages[currentStageIndex];
    const previousTarget = currentStageIndex > 0 ? stages[currentStageIndex - 1].targetPercentage : 0;
    const targetRange = stage.targetPercentage - previousTarget;
    
    // Time since last update in seconds
    const now = Date.now();
    const elapsedSeconds = (now - startTimeRef.current) / 1000;
    
    // Start slowing down after 60 seconds
    let speedFactor = 1;
    if (elapsedSeconds > 60) {
      // Gradually reduce speed as time goes on, but ensure it doesn't stop completely
      speedFactor = Math.max(0.05, 1 - (elapsedSeconds - 60) / 1140); // 1140s = 19 minutes after initial 60s
    }
    
    // Base increment - faster at start, slower as we approach target
    const distanceToTarget = stage.targetPercentage - currentProgress;
    const baseIncrement = Math.max(0.01, 0.1 * (distanceToTarget / targetRange));
    
    return baseIncrement * speedFactor;
  };

  const easeInOutQuad = (t: number): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const startProgress = () => {
    setIsComplete(false);
    setIsInitialProgress(true);
    setCurrentStage(0);
    setProgress(0);
    startTimeRef.current = Date.now();

    // Use requestAnimationFrame for smoother animation
    let startTime = Date.now();
    const duration = 3000; // 3 seconds for initial animation
    const animateInitialProgress = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smoother animation
      const easedProgress = easeInOutCubic(progress);
      const newValue = easedProgress * 5; // Animate to 5%
      
      setProgress(newValue);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateInitialProgress);
      } else {
        setIsInitialProgress(false);
        startMainProgress();
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animateInitialProgress);
  };

  const startMainProgress = () => {
    clearCurrentInterval();
    startTimeRef.current = Date.now();
    
    intervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        const increment = calculateIncrement(prev);
        const newProgress = prev + increment;
        
        // Check if we've completed
        if (newProgress >= 100) {
          clearCurrentInterval();
          setIsComplete(true);
          return 100;
        }
        
        // Update current stage if needed
        const newStageIndex = getCurrentStageIndex(newProgress);
        if (newStageIndex !== currentStage) {
          setCurrentStage(newStageIndex);
          startTimeRef.current = Date.now(); // Reset timer for new stage
        }
        
        return newProgress;
      });
      lastUpdateTimeRef.current = Date.now();
    }, 100); // Update 10 times per second for smooth animation
  };

  const handleGoToNextStage = () => {
    clearCurrentInterval();
    
    // Calculate the next target percentage based on current progress
    let targetPercentage = 33; // Default to first stage target
    
    if (progress < stages[0].targetPercentage) {
      targetPercentage = stages[0].targetPercentage;
    } else if (progress < stages[1].targetPercentage) {
      targetPercentage = stages[1].targetPercentage;
    } else if (progress < stages[2].targetPercentage) {
      targetPercentage = stages[2].targetPercentage;
    }
    
    // Animate to target percentage with easing
    const start = progress;
    const range = targetPercentage - start;
    const startTime = Date.now();
    const duration = 1000; // 1 second
    
    const animateSkip = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (elapsed < duration) {
        // Apply easing for smoother animation
        const progress = elapsed / duration;
        const easedProgress = easeInOutQuad(progress);
        const newProgress = start + (range * easedProgress);
        setProgress(newProgress);
        animationFrameRef.current = requestAnimationFrame(animateSkip);
      } else {
        setProgress(targetPercentage);
        const newStageIndex = getCurrentStageIndex(targetPercentage);
        setCurrentStage(newStageIndex);
        startTimeRef.current = Date.now();
        
        // If we haven't reached the end, continue normal progression
        if (targetPercentage < 100) {
          startMainProgress();
        } else {
          setIsComplete(true);
        }
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animateSkip);
  };

  const handleRestart = () => {
    clearCurrentInterval();
    startProgress();
  };

  // Start progress when component mounts
  useEffect(() => {
    startProgress();
    return () => clearCurrentInterval();
  }, []);

  // Update current stage based on progress
  useEffect(() => {
    if (!isComplete && !isInitialProgress) {
      const newStageIndex = getCurrentStageIndex(progress);
      if (newStageIndex !== currentStage) {
        setCurrentStage(newStageIndex);
      }
    }
  }, [progress, currentStage, isComplete, isInitialProgress]);

  return (
    <Card className="w-[400px] shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Mining insights</CardTitle>
        <div className="text-sm text-muted-foreground">
          {isComplete ? "Success!" : stages[currentStage].subtitle}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isComplete ? (
          <div className="flex justify-center items-center h-8 text-4xl">
            🎉
          </div>
        ) : (
          <ProgressGradient value={progress} />
        )}
        
        <div className="flex justify-between mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRestart}
            className="text-xs"
          >
            Restart
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGoToNextStage}
            className="text-xs"
            disabled={isComplete}
          >
            Go to next stage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MiningCard;
