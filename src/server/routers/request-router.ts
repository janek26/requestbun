import { requests } from "@/server/db/schema";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { j, publicProcedure } from "../jstack";

export const requestRouter = j.router({
  // Get requests for a project with optional date range filtering
  getByProject: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ c, ctx, input }) => {
      const { projectId, startDate, endDate, limit, offset } = input;
      const { db } = ctx;

      const conditions = [eq(requests.projectId, projectId)];

      if (startDate) {
        conditions.push(gte(requests.timestamp, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(requests.timestamp, new Date(endDate)));
      }

      const requestLogs = await db
        .select()
        .from(requests)
        .where(and(...conditions))
        .orderBy(desc(requests.timestamp))
        .limit(limit)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(requests)
        .where(and(...conditions));

      const total = countResult[0]?.count ?? 0;

      return c.superjson({
        requests: requestLogs,
        total,
      });
    }),

  // Get a single request by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ c, ctx, input }) => {
      const { id } = input;
      const { db } = ctx;

      const [requestLog] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, id))
        .limit(1);

      return c.superjson(requestLog ?? null);
    }),
});
