"use client";

import { Request } from "@/app/types/request";
import { format } from "date-fns";
import { cn } from "@/app/lib/utils";

interface RequestDetailProps {
  request: Request | null;
}

export const RequestDetail = ({ request }: RequestDetailProps) => {
  if (!request) {
    return (
      <div className="flex-1 p-8">
        <p className="text-zinc-400">Select a request to view details</p>
      </div>
    );
  }

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="flex-1 h-full">
      <div className="p-8 space-y-8">
        {/* Request Overview */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">
            Request Overview
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-400">Method</p>
              <p
                className={cn(
                  "font-mono mt-1",
                  request.method === "GET" && "text-green-400",
                  request.method === "POST" && "text-blue-400",
                  request.method === "PUT" && "text-yellow-400",
                  request.method === "DELETE" && "text-red-400",
                  "text-zinc-400"
                )}
              >
                {request.method}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Timestamp</p>
              <p className="font-mono mt-1 text-zinc-100">
                {format(new Date(request.timestamp), "yyyy-MM-dd HH:mm:ss")}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">IP Address</p>
              <p className="font-mono mt-1 text-zinc-100">
                {request.ip || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Query Parameters */}
        {request.query && Object.keys(request.query).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">
              Query Parameters
            </h2>
            <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm text-zinc-100">
                {formatJson(request.query)}
              </code>
            </pre>
          </div>
        )}

        {/* Headers */}
        {request.headers && Object.keys(request.headers).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">
              Headers
            </h2>
            <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm text-zinc-100">
                {formatJson(request.headers)}
              </code>
            </pre>
          </div>
        )}

        {/* Body */}
        {request.body && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Body</h2>
            <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm text-zinc-100">
                {formatJson(request.body)}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
