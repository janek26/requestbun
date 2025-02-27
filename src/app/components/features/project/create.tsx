"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { useRouter } from "next/navigation";

export const ProjectCreate = () => {
  const [name, setName] = useState<string>("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: createProject, isPending } = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const res = await client.project.create.$post({ name });
      return await res.json();
    },
    onSuccess: async (newProject) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setName("");
      // Redirect to the new project page
      if (newProject && newProject.id) {
        router.push(`/project/${newProject.id}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createProject({ name });
    }
  };

  return (
    <div className="w-full max-w-md backdrop-blur-lg bg-black/15 px-6 py-5 rounded-md text-zinc-100/75">
      <h2 className="text-xl font-semibold mb-3 text-zinc-100">
        Create Project
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Project name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-base/6 rounded-md bg-black/50 hover:bg-black/75 focus-visible:outline-none ring-2 ring-transparent hover:ring-zinc-800 focus:ring-zinc-800 focus:bg-black/75 transition h-12 px-4 py-2 text-zinc-100"
        />
        <button
          disabled={isPending || !name.trim()}
          type="submit"
          className="rounded-md text-base/6 ring-2 ring-offset-2 ring-offset-black focus-visible:outline-none focus-visible:ring-zinc-100 ring-transparent hover:ring-zinc-100 h-12 px-10 py-3 bg-brand-700 text-zinc-800 font-medium bg-gradient-to-tl from-zinc-300 to-zinc-200 transition hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
};
