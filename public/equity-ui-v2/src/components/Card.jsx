// Card component for data display
import React from 'react';

export const Card = ({
  title,
  children,
  className = '',
  headerActions = null,
  loading = false,
  error = null,
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
    >
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {headerActions && <div className="flex items-center space-x-2">{headerActions}</div>}
        </div>
      )}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400 text-center py-8">
            <p>{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export const DataCard = ({ title, data, className = '' }) => {
  return (
    <Card title={title} className={className}>
      <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
        {data ? JSON.stringify(data, null, 2) : 'No data available'}
      </pre>
    </Card>
  );
};
