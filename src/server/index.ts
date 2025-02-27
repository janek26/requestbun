import { j } from "./jstack";
import { projectRouter } from "./routers/project-router";
import { requestRouter } from "./routers/request-router";
import { logRequest } from "./log/request";

/**
 * This is your base API.
 * Here, you can handle errors, not-found responses, cors and more.
 *
 * @see https://jstack.app/docs/backend/app-router
 */
const api = j
  .router()
  .basePath("/api")
  .use(j.defaults.cors)
  .onError(j.defaults.errorHandler)
  .all("/x/:projectId", (c) => {
    void logRequest(c.req);
    return c.json({ status: 200, message: "OK" });
  })
  .all("/x/:projectId/200", (c) => {
    void logRequest(c.req);
    return c.json({ status: 200, message: "OK" });
  })
  .all("/x/:projectId/401", (c) => {
    void logRequest(c.req);
    return c.json({ status: 401, message: "Unauthorized" }, 401);
  })
  .all("/x/:projectId/404", (c) => {
    void logRequest(c.req);
    return c.json({ status: 404, message: "Not Found" }, 404);
  })
  .all("/x/:projectId/500", (c) => {
    void logRequest(c.req);
    return c.json({ status: 500, message: "Internal Server Error" }, 500);
  });
/**
 * This is the main router for your server.
 * All routers in /server/routers should be added here manually.
 */
const appRouter = j.mergeRouters(api, {
  project: projectRouter,
  requests: requestRouter,
});

export type AppRouter = typeof appRouter;

export default appRouter;
