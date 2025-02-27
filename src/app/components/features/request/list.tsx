"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { cn } from "@/app/lib/utils";
import { Request, RequestsResponse } from "@/app/types/request";
import { format } from "date-fns";

interface RequestListProps {
  projectId: string;
  selectedRequestId?: string;
  onRequestSelect: (request: Request) => void;
}

export const RequestList = ({
  projectId,
  selectedRequestId,
  onRequestSelect,
}: RequestListProps) => {
  // Fetch requests for the project
  const { data, isPending } = useQuery({
    queryKey: ["requests", projectId],
    queryFn: async () => {
      const res = await client.requests.getByProject.$get({
        projectId,
        limit: 50,
        offset: 0,
      });
      return (await res.json()) as RequestsResponse;
    },
    refetchInterval: 5000,
  });

  if (isPending) {
    return (
      <div className="w-80 h-full border-r border-zinc-800 bg-black/20">
        <div className="p-4">
          <p className="text-zinc-400">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (!data?.requests.length) {
    return (
      <div className="w-80 h-full border-r border-zinc-800 bg-black/20">
        <div className="p-4">
          <p className="text-zinc-400">No requests found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full border-r border-zinc-800 bg-black/20">
      <ScrollArea className="h-full">
        <div className="p-2">
          {data.requests.map((request) => (
            <button
              key={request.id}
              onClick={() => onRequestSelect(request)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition",
                "hover:bg-zinc-800/50",
                selectedRequestId === request.id && "bg-zinc-800/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "font-mono text-sm",
                    request.method === "GET" && "text-green-400",
                    request.method === "POST" && "text-blue-400",
                    request.method === "PUT" && "text-yellow-400",
                    request.method === "DELETE" && "text-red-400",
                    "text-zinc-400"
                  )}
                >
                  {request.method}
                </span>
                <span className="text-xs text-zinc-500">
                  {format(new Date(request.timestamp), "HH:mm:ss")}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-400 truncate">
                {request.ip || "No IP"}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
