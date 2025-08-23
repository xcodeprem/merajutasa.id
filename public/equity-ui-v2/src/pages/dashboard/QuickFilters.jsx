import React from 'react';

export function QuickFilters({ value, onChange }) {
  const { query = '', sort = 'desc', showAnomaliesOnly = false } = value || {};

  return (
    <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
      <div className="flex-1">
        <label
          htmlFor="quick-search"
          className="block text-sm text-gray-600 dark:text-gray-400 mb-1"
        >
          Search
        </label>
        <input
          id="quick-search"
          type="text"
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          placeholder="Filter under-served groups or anomalies..."
          value={query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="quick-sort" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          Sort
        </label>
        <select
          id="quick-sort"
          className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          value={sort}
          onChange={(e) => onChange({ ...value, sort: e.target.value })}
        >
          <option value="desc">Highest first</option>
          <option value="asc">Lowest first</option>
        </select>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <input
          id="anoms"
          type="checkbox"
          className="h-4 w-4"
          checked={showAnomaliesOnly}
          onChange={(e) => onChange({ ...value, showAnomaliesOnly: e.target.checked })}
        />
        <label htmlFor="anoms" className="text-sm text-gray-700 dark:text-gray-300">
          Anomalies only
        </label>
      </div>
    </div>
  );
}
