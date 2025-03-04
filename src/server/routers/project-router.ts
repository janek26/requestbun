import { projects, requests } from "@/server/db/schema";
import { desc, eq, and, lte, inArray } from "drizzle-orm";
import { z } from "zod";
import { j, publicProcedure } from "../jstack";
import { forwardRequest } from "../log/forward";

export const projectRouter = j.router({
  // Get all projects
  getAll: publicProcedure.query(async ({ c, ctx }) => {
    const { db } = ctx;

    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

    return c.superjson(allProjects);
  }),

  // Get a single project by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ c, ctx, input }) => {
      const { id } = input;
      const { db } = ctx;

      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);

      return c.superjson(project ?? null);
    }),

  // Create a new project
  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, c, input }) => {
      const { name } = input;
      const { db } = ctx;

      const [project] = await db.insert(projects).values({ name }).returning();

      return c.superjson(project);
    }),

  // Update an existing project
  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1),
        rewriteUrl: z.string().url().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, c, input }) => {
      const { id, name, rewriteUrl } = input;
      const { db } = ctx;

      const [updatedProject] = await db
        .update(projects)
        .set({
          name,
          rewriteUrl,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

      return c.superjson(updatedProject ?? null);
    }),

  // Delete a project
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, c, input }) => {
      const { id } = input;
      const { db } = ctx;

      // First delete all associated requests
      await db.delete(requests).where(eq(requests.projectId, id));

      // Then delete the project
      const [deletedProject] = await db
        .delete(projects)
        .where(eq(projects.id, id))
        .returning();

      return c.superjson(deletedProject ?? null);
    }),

  // Backrun requests through rewrite URL
  backrun: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        count: z.number().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, c, input }) => {
      const { projectId, count } = input;
      const { db } = ctx;

      // Get project to check if rewrite URL exists
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project?.rewriteUrl) {
        throw new Error("No rewrite URL configured for this project");
      }

      // Get the most recent requests up to count
      const recentRequests = await db
        .select()
        .from(requests)
        .where(eq(requests.projectId, projectId))
        .orderBy(desc(requests.timestamp))
        .limit(count);

      // Update requests as forwarded
      if (recentRequests.length > 0) {
        await db
          .update(requests)
          .set({ forwarded: true })
          .where(
            inArray(
              requests.id,
              recentRequests.map((request) => request.id)
            )
          );

        // Forward the requests
        for (const request of recentRequests) {
          await forwardRequest(
            projectId,
            request.method,
            request.query as Record<string, string>,
            request.headers as Record<string, string>,
            request.body,
            project.rewriteUrl,
            request.ip ?? undefined
          );
        }
      }

      return c.superjson({
        processed: recentRequests.length,
        rewriteUrl: project.rewriteUrl,
      });
    }),
});
