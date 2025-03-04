"use client";

import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@/lib/client";
import { cn } from "@/app/lib/utils";
import { Request } from "@/app/types/request";
import { format } from "date-fns";
import { ArrowRightCircleIcon, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

const PAGE_SIZE = 50;

interface RequestListProps {
  projectId: string;
  selectedRequestId?: string;
  onRequestSelect: (request: Request) => void;
}

const fetchRequestsPageByProject =
  (projectId: string, fromCursor: boolean) =>
  async ({ pageParam }: { pageParam?: string }) => {
    const res = await client.requests.getByProject.$get({
      projectId,
      limit: PAGE_SIZE,
      cursor: pageParam,
      fromCursor,
    });
    return await res.json();
  };

export const RequestList = ({
  projectId,
  selectedRequestId,
  onRequestSelect,
}: RequestListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const {
    data: { items: allRequests = [], previousCursor } = {},
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["requests", projectId],
    queryFn: fetchRequestsPageByProject(projectId, false),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    select: (data) => {
      return {
        items: data.pages.flatMap((page) => page.items),
        previousCursor: data.pages[0]?.previousCursor,
      };
    },
  });

  // Poll for new requests by checking if there are any requests with IDs greater than our most recent one
  useEffect(() => {
    const interval = setInterval(() => {
      if (previousCursor) {
        fetchRequestsPageByProject(
          projectId,
          true
        )({
          pageParam: previousCursor,
        }).then((res) => {
          queryClient.setQueryData(
            ["requests", projectId],
            (
              data: InfiniteData<
                {
                  items: Request[];
                  nextCursor: string | undefined;
                  previousCursor: string | undefined;
                },
                string | undefined
              >
            ) =>
              res.items.length
                ? {
                    pages: [res, ...data.pages],
                    pageParams: [res.previousCursor, ...data.pageParams],
                  }
                : data
          );
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [previousCursor]);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRequests.length + 1 : allRequests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;
    if (
      lastItem.index >= allRequests.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    rowVirtualizer.getVirtualItems(),
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    allRequests.length,
  ]);

  if (isPending) {
    return (
      <div className="w-full h-full border-r border-zinc-800 bg-black/20">
        <div className="p-4">
          <p className="text-zinc-400">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (!allRequests.length) {
    return (
      <div className="w-full h-full border-r border-zinc-800 bg-black/20">
        <div className="p-4">
          <p className="text-zinc-400">No requests found</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="w-full h-full border-r border-zinc-800 bg-black/20 overflow-auto"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const request = allRequests[virtualRow.index];
          if (!request) {
            if (hasNextPage) {
              return (
                <div
                  key="loader"
                  className="p-4 text-center text-zinc-400 flex items-center justify-center"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              );
            }
            return null;
          }

          return (
            <div
              key={request.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md cursor-pointer transition",
                "hover:bg-black/50",
                selectedRequestId === request.id && "bg-black/50"
              )}
              onClick={() => onRequestSelect(request)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded",
                      request.method === "GET" &&
                        "bg-blue-500/20 text-blue-400",
                      request.method === "POST" &&
                        "bg-green-500/20 text-green-400",
                      request.method === "PUT" &&
                        "bg-yellow-500/20 text-yellow-400",
                      request.method === "DELETE" &&
                        "bg-red-500/20 text-red-400"
                    )}
                  >
                    {request.method}
                  </span>
                  <span className="text-sm text-zinc-500">{request.ip}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="mt-1 text-xs text-zinc-500">
                    {format(new Date(request.timestamp), "HH:mm:ss")}
                  </div>
                  {request.forwarded && (
                    <Tooltip>
                      <TooltipTrigger>
                        <ArrowRightCircleIcon className="w-3.5 h-3.5 text-green-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Request forwarded successfully</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
