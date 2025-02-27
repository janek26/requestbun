import { projects, requests } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { j, publicProcedure } from "../jstack";

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
      })
    )
    .mutation(async ({ ctx, c, input }) => {
      const { id, name } = input;
      const { db } = ctx;

      const [updatedProject] = await db
        .update(projects)
        .set({
          name,
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
});
