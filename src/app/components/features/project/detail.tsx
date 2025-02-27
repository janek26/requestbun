"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { useState } from "react";
import Link from "next/link";
import { HomeIcon } from "lucide-react";
import { Button } from "../../ui/button";
import { toast } from "sonner";

type Project = {
  id: string;
  name: string;
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

  // Fetch project details
  const { data: project, isPending: isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await client.project.getById.$get({ id });
      const data = (await res.json()) as Project | null;

      if (data) {
        setProjectName(data.name);
      }

      return data;
    },
  });

  // Update project mutation
  const { mutate: updateProject, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await client.project.update.$post({ id, name });
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project", id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsEditing(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      updateProject({ id, name: projectName });
    }
  };

  const handleCopyEndpoint = () => {
    const origin = window.location.origin;
    navigator.clipboard.writeText(`${origin}/x/${id}`);

    toast.success("Endpoint copied to clipboard");
  };

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
    <div className="w-full backdrop-blur-lg bg-black/15 px-8 py-4 rounded-t-md text-zinc-100/75">
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
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/x/${id}`}
              className="w-64 text-sm bg-black/50 rounded-md px-3 py-1.5 text-zinc-400"
            />
            <button
              onClick={handleCopyEndpoint}
              className="h-8 px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
