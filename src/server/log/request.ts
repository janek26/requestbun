import { neon } from "@neondatabase/serverless";
import { HonoRequest } from "hono";
import { drizzle } from "drizzle-orm/neon-http";
import { requests, projects } from "../db/schema";
import { eq } from "drizzle-orm";
import { forwardRequest } from "./forward";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function parseBody(req: HonoRequest, method: string) {
  if (method === "GET" || method === "HEAD") return null;

  const parsers = [
    () => req.json(),
    async () => {
      const formData = await req.formData();
      const obj: Record<string, string | File> = {};
      formData.forEach((v, k) => (obj[k] = v));
      return obj;
    },
    () => req.text(),
    async () => {
      const buf = await req.arrayBuffer();
      return `Binary data of ${buf.byteLength} bytes`;
    },
  ];

  for (const parse of parsers) {
    try {
      return await parse();
    } catch {
      continue;
    }
  }

  return null;
}

export async function logRequest(
  req: HonoRequest<`${string}/api/x/:projectId`>
) {
  const projectId = req.param("projectId");
  const method = req.method;
  const query = req.query();
  const headers = req.header();
  const ip = req.header("x-forwarded-for") || req.header("x-real-ip");
  const body = await parseBody(req, method);

  // Check if project has rewrite URL configured
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  let forwarded = false;
  if (project?.rewriteUrl) {
    forwarded = await forwardRequest(
      projectId,
      method,
      query,
      headers,
      body,
      project.rewriteUrl,
      ip
    );
  }

  // Log the request
  await db.insert(requests).values({
    projectId,
    method,
    query,
    headers,
    body,
    ip,
    forwarded,
  });
}
