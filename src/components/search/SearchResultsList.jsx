import React from 'react';
import SearchResultCard from '@/components/search/SearchResultCard';

export default function SearchResultsList({ results }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2" data-testid="search-results-list">
      {results.map((result) => (
        <li key={result.id || result.slug}>
          <SearchResultCard result={result} />
        </li>
      ))}
    </ul>
  );
}
