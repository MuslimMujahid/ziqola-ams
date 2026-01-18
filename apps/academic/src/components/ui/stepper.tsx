import React from "react";

import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StepItem = {
  key: string;
  title: string;
};

type StepKeyOrIndex = StepItem["key"] | number;

type StepContextValue = {
  steps: ReadonlyArray<StepItem>;
  activeStep: number;
  resolveStepIndex: (step: StepKeyOrIndex) => number;
  isActive: (step: StepKeyOrIndex) => boolean;
  isCompleted: (step: StepKeyOrIndex) => boolean;
  goToStep: (step: StepKeyOrIndex) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
};

type StepProviderProps = {
  steps: ReadonlyArray<StepItem>;
  activeStep: number;
  resolveStepIndex: (step: StepKeyOrIndex) => number;
  isActive: (step: StepKeyOrIndex) => boolean;
  isCompleted: (step: StepKeyOrIndex) => boolean;
  goToStep: (step: StepKeyOrIndex) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  children: React.ReactNode;
};

type UseStepOptions = {
  steps: ReadonlyArray<StepItem>;
  initialStep?: StepKeyOrIndex;
};

type StepLabelsProps = {
  className?: string;
};

type StepLabelProps = {
  step: StepItem;
  index: number;
  showConnector?: boolean;
  className?: string;
};

type StepContentProps = {
  stepKey?: StepItem["key"];
  stepIndex?: number;
  children: React.ReactNode;
};

const StepperContext = React.createContext<StepContextValue | null>(null);

export function useStepContext() {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("useStepContext must be used within StepProvider");
  }
  return context;
}

export function resolveStepIndex(
  steps: ReadonlyArray<StepItem>,
  step: StepKeyOrIndex,
): number {
  if (typeof step === "number") {
    return step;
  }
  return steps.findIndex((item) => item.key === step);
}

export function useStep({ steps, initialStep = 0 }: UseStepOptions) {
  const resolvedInitialStep = React.useMemo(() => {
    const index = resolveStepIndex(steps, initialStep);
    return index >= 0 ? index : 0;
  }, [initialStep, steps]);

  const [activeStep, setActiveStep] =
    React.useState<number>(resolvedInitialStep);

  const resolveIndex = React.useCallback(
    (step: StepKeyOrIndex) => resolveStepIndex(steps, step),
    [steps],
  );

  const goToStep = React.useCallback(
    (step: StepKeyOrIndex) => {
      const index = resolveIndex(step);
      if (index < 0) {
        return;
      }
      setActiveStep(index);
    },
    [resolveIndex],
  );

  const goToNext = React.useCallback(() => {
    setActiveStep((currentStep) => Math.min(currentStep + 1, steps.length - 1));
  }, [steps.length]);

  const goToPrevious = React.useCallback(() => {
    setActiveStep((currentStep) => Math.max(currentStep - 1, 0));
  }, []);

  const isActive = React.useCallback(
    (step: StepKeyOrIndex) => resolveIndex(step) === activeStep,
    [activeStep, resolveIndex],
  );

  const isCompleted = React.useCallback(
    (step: StepKeyOrIndex) => resolveIndex(step) < activeStep,
    [activeStep, resolveIndex],
  );

  const isFirstStep = activeStep <= 0;
  const isLastStep = activeStep >= steps.length - 1;

  return {
    steps,
    activeStep,
    resolveStepIndex: resolveIndex,
    isActive,
    isCompleted,
    goToStep,
    goToNext,
    goToPrevious,
    isFirstStep,
    isLastStep,
  } satisfies StepContextValue;
}

export function StepProvider({ children, ...value }: StepProviderProps) {
  return (
    <StepperContext.Provider value={value}>{children}</StepperContext.Provider>
  );
}

export function StepLabels({ className }: StepLabelsProps) {
  const { steps } = useStepContext();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 text-xs font-medium text-ink-muted",
        className,
      )}
    >
      {steps.map((step, index) => (
        <StepLabel
          key={step.key}
          step={step}
          index={index}
          showConnector={index < steps.length - 1}
        />
      ))}
    </div>
  );
}

export function StepLabel({
  step,
  index,
  showConnector = true,
  className,
}: StepLabelProps) {
  const { activeStep, isCompleted } = useStepContext();
  const isActive = activeStep === index;
  const isDone = isCompleted(index);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition",
          isDone
            ? "bg-success text-white"
            : isActive
              ? "bg-primary text-white"
              : "bg-surface-2 text-ink-muted",
        )}
        aria-current={isActive ? "step" : undefined}
      >
        {isDone ? (
          <CheckIcon className="h-4 w-4" aria-hidden="true" />
        ) : (
          index + 1
        )}
      </div>
      <span
        className={cn(
          "text-sm",
          isActive ? "text-ink-strong" : "text-ink-muted",
        )}
      >
        {step.title}
      </span>
      {showConnector ? (
        <div
          className="h-0.5 w-8 rounded-full bg-surface-2"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

export function StepContent({
  stepKey,
  stepIndex,
  children,
}: StepContentProps) {
  const { activeStep, resolveStepIndex: resolveIndex } = useStepContext();

  const resolvedIndex =
    typeof stepIndex === "number"
      ? stepIndex
      : stepKey
        ? resolveIndex(stepKey)
        : -1;

  if (resolvedIndex !== activeStep) {
    return null;
  }

  return <>{children}</>;
}

export type { StepItem, StepKeyOrIndex };
