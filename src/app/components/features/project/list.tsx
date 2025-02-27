"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

type Project = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export const ProjectList = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch all projects
  const { data: projects, isPending: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await client.project.getAll.$get();
      return (await res.json()) as Project[];
    },
  });

  // Delete project mutation
  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.project.delete.$post({ id });
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectToDelete(null);
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
    }
  };

  const cancelDelete = () => {
    setProjectToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const navigateToProject = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  return (
    <>
      <div className="w-full max-w-md backdrop-blur-lg bg-black/15 px-6 py-5 rounded-md text-zinc-100/75">
        <h2 className="text-xl font-semibold mb-3 text-zinc-100">Projects</h2>

        {isLoadingProjects ? (
          <p className="text-[#ececf399] text-base/6">Loading projects...</p>
        ) : !projects || projects.length === 0 ? (
          <p className="text-[#ececf399] text-base/6">No projects found.</p>
        ) : (
          <ScrollArea className="h-[320px] rounded-md border border-zinc-800">
            <ul className="divide-y divide-zinc-800/50">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="group px-4 py-3 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  onClick={() => navigateToProject(project.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-zinc-100 truncate group-hover:text-white">
                        {project.name}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Created{" "}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteClick(e, project)}
                      disabled={isDeleting}
                      className="ml-2 text-xs px-2.5 py-1 rounded-full bg-zinc-800/70 hover:bg-red-900/50 text-zinc-400 hover:text-red-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action will permanently delete the project
              {projectToDelete ? ` "${projectToDelete.name}"` : ""}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={cancelDelete}
              className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-900 text-red-100 hover:bg-red-800"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
