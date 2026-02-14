import SearchResultCard from '@/components/search/SearchResultCard';

export default function SearchResultsList({ results }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2" data-testid="search-results-list">
      {results.map((result, index) => (
        <li key={result.id || result.slug || `result-${index}`}>
          <SearchResultCard result={result} />
        </li>
      ))}
    </ul>
  );
}
