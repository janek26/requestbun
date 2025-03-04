"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client, getBaseUrl } from "@/lib/client";
import { useState } from "react";
import Link from "next/link";
import { CopyIcon, HomeIcon, ArrowRight } from "lucide-react";
import { Button } from "../../ui/button";
import { toast } from "sonner";
import { RequestList } from "../request/list";
import { RequestDetail } from "../request/detail";
import { Request } from "@/app/types/request";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/app/components/ui/resizable";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";

type Project = {
  id: string;
  name: string;
  rewriteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface ProjectDetailProps {
  id: string;
}

export const ProjectDetail = ({ id }: ProjectDetailProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [rewriteUrl, setRewriteUrl] = useState<string | null>(null);
  const [backrunCount, setBackrunCount] = useState<number>(0);

  const endpoint = `${getBaseUrl()}/api/x/${id}`;

  // Fetch project details
  const { data: project, isPending: isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await client.project.getById.$get({ id });
      const data = (await res.json()) as Project | null;

      if (data) {
        setProjectName(data.name);
        setRewriteUrl(data.rewriteUrl);
      }

      return data;
    },
  });

  // Update project mutation
  const { mutate: updateProject, isPending: isUpdating } = useMutation({
    mutationFn: async ({
      id,
      name,
      rewriteUrl,
    }: {
      id: string;
      name: string;
      rewriteUrl?: string | null;
    }) => {
      const res = await client.project.update.$post({ id, name, rewriteUrl });
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project", id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsEditing(false);
      toast.success("Project updated successfully");
    },
  });

  // Backrun mutation
  const { mutate: backrunRequests, isPending: isBackrunning } = useMutation({
    mutationFn: async ({
      projectId,
      count,
    }: {
      projectId: string;
      count: number;
    }) => {
      const res = await client.project.backrun.$post({ projectId, count });
      return await res.json();
    },
    onSuccess: async (_, { projectId }) => {
      await queryClient.invalidateQueries({
        queryKey: ["requests", projectId],
      });
      toast.success("Backrun started successfully");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      updateProject({ id, name: projectName });
    }
  };

  const handleRewriteSubmit = () => {
    if (rewriteUrl?.trim()) {
      updateProject({ id, name: projectName, rewriteUrl });
      if (backrunCount > 0) {
        backrunRequests({ projectId: id, count: backrunCount });
      }
    } else {
      updateProject({ id, name: projectName, rewriteUrl: null });
    }
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(endpoint);
    toast.success("Endpoint copied to clipboard");
  };

  const isDisabled = rewriteUrl === null;

  if (isLoading || !project) {
    return (
      <div className="w-full backdrop-blur-lg bg-black/15 px-8 py-4 rounded-t-md text-zinc-100/75">
        <p className="text-[#ececf399] text-base/6">
          {isLoading ? "Loading..." : "Project not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="w-full backdrop-blur-lg bg-black/15 px-8 py-4 text-zinc-100/75">
        <div className="flex justify-between items-center gap-6">
          <Button
            asChild
            variant="ghost"
            size="icon"
            title="Back to Projects"
            className="transition-colors"
          >
            <Link href="/">
              <HomeIcon className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="flex-1 text-lg rounded-md bg-black/50 hover:bg-black/75 focus-visible:outline-none ring-2 ring-transparent hover:ring-zinc-800 focus:ring-zinc-800 focus:bg-black/75 transition h-9 px-3 py-1 text-zinc-100"
                />
                <button
                  type="submit"
                  disabled={isUpdating || !projectName.trim()}
                  className="h-9 px-4 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition"
                >
                  {isUpdating ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProjectName(project.name);
                    setIsEditing(false);
                  }}
                  className="h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-sm font-medium transition"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-baseline gap-3">
                <h2
                  className="text-xl font-semibold text-zinc-100 cursor-pointer hover:text-zinc-200"
                  onClick={() => setIsEditing(true)}
                >
                  {project.name}
                </h2>
                <span className="text-xs text-zinc-500">
                  Last saved: {new Date(project.updatedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">
                      Request Rewrite
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Forward incoming requests to another URL
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rewrite"
                        checked={!isDisabled}
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            setRewriteUrl(null);
                          } else {
                            setRewriteUrl("");
                          }
                        }}
                      />
                      <label
                        htmlFor="rewrite"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enable request rewrite
                      </label>
                    </div>
                    <div className="space-y-2">
                      <Input
                        id="url"
                        placeholder="https://api.example.com"
                        value={rewriteUrl ?? ""}
                        onChange={(e) => setRewriteUrl(e.target.value)}
                        disabled={isDisabled}
                      />
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={backrunCount}
                          onChange={(e) =>
                            setBackrunCount(parseInt(e.target.value, 10))
                          }
                          disabled={isDisabled}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">
                          Historical requests to rewrite
                        </span>
                      </div>
                      <Button
                        onClick={handleRewriteSubmit}
                        disabled={isUpdating || isBackrunning}
                        className="w-full"
                      >
                        {isUpdating ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={endpoint}
                className="w-64 text-sm bg-black/50 rounded-md px-3 py-1.5 text-zinc-400"
              />
              <Button
                variant="ghost"
                onClick={handleCopyEndpoint}
                size="icon"
                className="transition-colors"
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 overflow-hidden"
      >
        <ResizablePanel defaultSize={20} minSize={10}>
          <RequestList
            projectId={id}
            selectedRequestId={selectedRequest?.id}
            onRequestSelect={setSelectedRequest}
          />
        </ResizablePanel>
        <ResizableHandle className="w-1 bg-zinc-800" />
        <ResizablePanel>
          <RequestDetail request={selectedRequest} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
