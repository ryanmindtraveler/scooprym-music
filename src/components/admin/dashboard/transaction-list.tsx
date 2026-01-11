import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RecentTransaction } from './types';

export function TransactionList({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest payments and subscriptions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <p className="text-sm">No recent transactions.</p>
            </div>
          )}
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{tx.user?.name || tx.user?.email || 'Unknown User'}</p>
                <p className="text-xs text-muted-foreground">{tx.user?.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={tx.type === 'subscription' ? 'default' : 'secondary'}>{tx.type}</Badge>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {(tx.amount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </p>
                  <p className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
