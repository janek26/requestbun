import { requests } from "@/server/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { j, publicProcedure } from "../jstack";
import { Request } from "@/app/types/request";

export const requestRouter = j.router({
  // Get requests for a project with optional date range filtering
  getByProject: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        fromCursor: z.boolean().optional().default(false),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ c, ctx, input }) => {
      const { projectId, cursor, fromCursor, limit } = input;
      const { db } = ctx;

      const conditions = [eq(requests.projectId, projectId)];

      if (cursor) {
        if (fromCursor) {
          conditions.push(
            sql`${requests.timestamp} > (SELECT timestamp FROM ${requests} WHERE id = ${cursor})`
          );
        } else {
          conditions.push(
            sql`${requests.timestamp} < (SELECT timestamp FROM ${requests} WHERE id = ${cursor})`
          );
        }
      }

      const items = await db
        .select()
        .from(requests)
        .where(and(...conditions))
        .orderBy(desc(requests.timestamp)) // Ensure ordering by a comparable field
        .limit(limit)
        .then((res) => {
          return res as Request[];
        });

      const nextCursor = items[items.length - 1]?.id;
      const previousCursor = items[0]?.id ?? cursor;

      return c.superjson({
        items,
        nextCursor,
        previousCursor,
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
