export async function forwardRequest(
  projectId: string,
  method: string,
  query: Record<string, string>,
  headers: Record<string, string>,
  body: any,
  rewriteUrl: string,
  ip: string | undefined
): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000);

  try {
    const url = new URL(rewriteUrl);
    // Add query parameters
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    // Forward the request
    const response = await fetch(url.toString(), {
      method,
      headers: {
        ...headers,
        ...(ip && { "x-forwarded-for": ip }),
        ...(projectId && { "x-project-id": projectId }),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    return response.ok;
  } catch (error) {
    console.error("Error forwarding request:", error);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
