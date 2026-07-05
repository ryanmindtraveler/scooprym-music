import 'server-only';

import { getDb } from '@/db';
import { session as sessionTable, user as userTable } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { cache } from 'react';
import { auth } from './auth';

/**
 * Get the current session
 *
 * NOTICE: do not call it from middleware
 */
export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user || process.env.NODE_ENV !== 'development') {
    return session;
  }

  // Dev fallback: when local cookie/session propagation breaks, use the latest live session
  // so the protected UI and local API routes stay aligned during real-browser testing.
  const db = await getDb();
  const latest = await db
    .select({
      session: sessionTable,
      user: userTable,
    })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
    .orderBy(desc(sessionTable.updatedAt))
    .limit(1);

  if (latest[0]) {
    return {
      session: latest[0].session,
      user: latest[0].user,
    };
  }

  return session;
});
