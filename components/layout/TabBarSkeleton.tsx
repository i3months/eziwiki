export function TabBarSkeleton() {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-x-auto px-2 py-1">
      {/* Skeleton tabs */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md w-[180px] flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 animate-pulse"
        >
          <div className="flex-1 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="w-3.5 h-3.5 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      ))}

      {/* New tab button skeleton */}
      <div className="flex-shrink-0 p-2 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
    </div>
  );
}
