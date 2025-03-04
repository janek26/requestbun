export async function forwardRequest(
  projectId: string,
  method: string,
  query: Record<string, string>,
  headers: Record<string, string>,
  body: any,
  rewriteUrl: string,
  ip: string | undefined
) {
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
    });

    return response.ok;
  } catch (error) {
    console.error("Error forwarding request:", error);
    return false;
  }
}
