import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Enhanced Skeleton Components
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm p-6", className)} {...props}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  )
}

function SkeletonText({ lines = 3, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")} />
      ))}
    </div>
  )
}

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton className={cn("h-10 w-10 rounded-full", className)} {...props} />
  )
}

function SkeletonButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton className={cn("h-10 w-24 rounded-md", className)} {...props} />
  )
}

// Loading Spinner Component
function LoadingSpinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size], className)} />
  );
}

// Pulse Animation Component
function PulseDot({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={cn("w-2 h-2 bg-primary rounded-full animate-pulse", className)}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

// Loading Dots Component
function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <PulseDot delay={0} />
      <PulseDot delay={200} />
      <PulseDot delay={400} />
    </div>
  );
}

// Error State Component
function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error while loading this content.",
  onRetry,
  showHomeButton = true,
  className
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="relative">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}

        {showHomeButton && (
          <Button variant="default" size="sm" className="gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({
  title = "No data found",
  message = "There's nothing to display here yet.",
  icon: Icon = AlertCircle,
  action,
  className
}: {
  title?: string;
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <Icon className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>

      {action && (
        <Button onClick={action.onClick} variant="default" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Page Transition Wrapper
function PageTransition({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2",
      className
    )}>
      {children}
    </div>
  );
}

// Smooth Loading Animation
function SmoothLoading({
  isLoading,
  children,
  fallback,
  className
}: {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "transition-opacity duration-300",
        isLoading ? "opacity-0" : "opacity-100"
      )}>
        {children}
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          {fallback || <LoadingSpinner size="lg" />}
        </div>
      )}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonText, SkeletonAvatar, SkeletonButton, LoadingSpinner, LoadingDots, PulseDot, ErrorState, EmptyState, PageTransition, SmoothLoading } 