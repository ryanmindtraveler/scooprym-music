import { getModelPrices } from '@/lib/model-pricing';

export async function ModelPricing({ observed }: { observed: Array<{ provider: string; model: string }> }) {
  const rows = await getModelPrices(observed);
  return (
    <section aria-labelledby="model-pricing-title" className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 p-5">
        <div>
          <h2 id="model-pricing-title" className="text-base font-bold">
            Model pricing
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Official unit rates for configured models and recent workflow models. USD and CNY are shown separately.
          </p>
        </div>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
          Actual spend: not collected
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <caption className="sr-only">Provider prices, billing units, sources and verification times</caption>
          <thead className="border-b bg-muted/20 text-muted-foreground">
            <tr>
              {['Model / route', 'Published unit rates', 'Source / checked (UTC)'].map((label) => (
                <th key={label} scope="col" className="px-5 py-3 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={`${row.provider}/${row.model}`} className="align-top">
                <td className="px-5 py-4">
                  <div className="font-semibold">{row.model}</div>
                  <div className="mt-1 text-muted-foreground">
                    {row.provider} · {row.purpose}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {row.rates.length ? (
                    <ul className="space-y-1.5">
                      {row.rates.map((rate, index) => (
                        <li key={`${rate.label}-${index}`}>
                          <span className="font-semibold tabular-nums">
                            {row.currency}{' '}
                            {new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(rate.amount)}
                          </span>
                          <span className="text-muted-foreground">
                            {' '}
                            / {rate.unit} · {rate.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground">Unavailable</span>
                  )}
                  <p className="mt-2 max-w-xl text-[11px] leading-relaxed text-muted-foreground">{row.note}</p>
                </td>
                <td className="px-5 py-4">
                  {row.source ? (
                    <a
                      href={row.source}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-pink-600 underline underline-offset-4 dark:text-pink-400"
                    >
                      Official source ↗
                    </a>
                  ) : (
                    '—'
                  )}
                  <div className="mt-2 whitespace-nowrap text-muted-foreground">
                    {row.checkedAt ? row.checkedAt.replace('T', ' ').slice(0, 16) : 'Not verified'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t bg-muted/20 px-5 py-3 text-xs leading-relaxed text-muted-foreground">
        Unit prices are not billed totals. Workflow counts do not include every provider attempt. Per-request charges
        and 24-hour model spend are unavailable until billing usage is recorded; missing prices never mean free.
      </p>
    </section>
  );
}
