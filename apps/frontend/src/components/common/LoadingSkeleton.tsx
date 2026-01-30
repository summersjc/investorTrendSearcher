interface LoadingSkeletonProps {
  type?: 'text' | 'title' | 'avatar' | 'card' | 'table' | 'graph';
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({
  type = 'text',
  count = 1,
  className = ''
}: LoadingSkeletonProps) {
  const baseClass = 'animate-pulse bg-gray-200 rounded';

  const renderSkeleton = () => {
    switch (type) {
      case 'title':
        return <div className={`${baseClass} h-8 w-3/4 mb-4 ${className}`} />;

      case 'text':
        return <div className={`${baseClass} h-4 w-full mb-2 ${className}`} />;

      case 'avatar':
        return <div className={`${baseClass} h-12 w-12 rounded-full ${className}`} />;

      case 'card':
        return (
          <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
            <div className={`${baseClass} h-6 w-3/4 mb-4`} />
            <div className={`${baseClass} h-4 w-full mb-2`} />
            <div className={`${baseClass} h-4 w-5/6 mb-2`} />
            <div className={`${baseClass} h-4 w-4/6`} />
          </div>
        );

      case 'table':
        return (
          <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
            <div className={`${baseClass} h-12 w-full mb-2`} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`${baseClass} h-16 w-full mb-1`} />
            ))}
          </div>
        );

      case 'graph':
        return (
          <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
            <div className={`${baseClass} h-6 w-1/4 mb-6`} />
            <div className={`${baseClass} h-64 w-full`} />
          </div>
        );

      default:
        return <div className={`${baseClass} h-4 w-full ${className}`} />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </>
  );
}
