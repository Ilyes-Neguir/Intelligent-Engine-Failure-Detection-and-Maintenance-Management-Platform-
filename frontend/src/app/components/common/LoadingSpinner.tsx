export function LoadingSpinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const sizeClass = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-3' }[size];
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClass} rounded-full border-blue-600 border-t-transparent animate-spin`} />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
}

export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-64">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
