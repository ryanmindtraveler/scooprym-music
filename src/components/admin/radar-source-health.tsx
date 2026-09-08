import { getStoryFreshness } from '@/lib/story-radar/classifier';
import type { RadarScanSummary } from '@/lib/story-radar/types';

export function RadarSourceHealth({ scan }: { scan: RadarScanSummary | null }) {
  return (
    <section className="rounded-xl border bg-card p-4" aria-label="News source health">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">Source health</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Collection schedule: every 30 minutes. The daily edition stays at 6 PM Los Angeles time.
          </p>
        </div>
        {scan && (
          <div className="text-xs text-muted-foreground">
            <span
              className={scan.status === 'failed' ? 'font-semibold text-destructive' : 'font-semibold text-foreground'}
            >
              {scan.status.toUpperCase()}
            </span>
            {' · '}
            <time dateTime={scan.startedAt}>{scan.startedAt.replace('T', ' ').slice(0, 16)} UTC</time>
          </div>
        )}
      </div>
      {!scan ? (
        <p className="mt-3 text-sm text-muted-foreground">No scan recorded yet. Scan the sources to check coverage.</p>
      ) : (
        <>
          <p className="mt-3 text-sm">
            <strong>{scan.inserted}</strong> new articles · <strong>{scan.updated}</strong> existing articles refreshed
            · <strong>{scan.discovered}</strong> valid articles collected
          </p>
          {scan.error && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {scan.error}
            </p>
          )}
          {scan.status === 'running' && (
            <p role="status" className="mt-2 text-sm text-muted-foreground">
              Collecting sources. Results appear when the scan finishes.
            </p>
          )}
          {scan.sources.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Results from the most recent news collection</caption>
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th scope="col" className="py-2 pr-4">
                      Source
                    </th>
                    <th scope="col" className="pr-4">
                      Status
                    </th>
                    <th scope="col" className="pr-4">
                      Received / valid
                    </th>
                    <th scope="col" className="pr-4">
                      Needs review
                    </th>
                    <th scope="col" className="pr-4">
                      Older than 3 days
                    </th>
                    <th scope="col">Latest article</th>
                  </tr>
                </thead>
                <tbody>
                  {scan.sources.map((source) => (
                    <tr key={source.name} className="border-b last:border-0">
                      <th scope="row" className="py-2.5 pr-4 font-medium">
                        {source.name}
                        {source.topics !== undefined && (
                          <span className="block font-normal text-muted-foreground">
                            {source.topics} trending topics
                          </span>
                        )}
                      </th>
                      <td className="pr-4">
                        <span
                          className={
                            source.status === 'failed'
                              ? 'text-destructive'
                              : source.status === 'ok'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-muted-foreground'
                          }
                        >
                          {source.status === 'ok'
                            ? 'Available'
                            : source.status === 'empty'
                              ? 'Empty feed'
                              : source.status === 'disabled'
                                ? 'Disabled'
                                : 'Failed'}
                        </span>
                        {source.error && <p className="mt-1 max-w-64 text-muted-foreground">{source.error}</p>}
                      </td>
                      <td className="pr-4 tabular-nums">
                        {source.fetched} / {source.accepted}
                        {source.invalid > 0 && (
                          <span className="block text-muted-foreground">{source.invalid} invalid entries</span>
                        )}
                      </td>
                      <td className="pr-4 tabular-nums">{source.needsReview}</td>
                      <td className="pr-4 tabular-nums">{source.older}</td>
                      <td className="whitespace-nowrap">
                        {source.latestPublishedAt ? (
                          <>
                            <time dateTime={source.latestPublishedAt}>{source.latestPublishedAt.slice(0, 10)}</time>
                            {getStoryFreshness(source.latestPublishedAt) === 'older' && (
                              <span className="ml-2 text-amber-700 dark:text-amber-400">Older feed</span>
                            )}
                          </>
                        ) : (
                          'Unknown'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
