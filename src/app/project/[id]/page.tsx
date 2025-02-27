import { notFound } from "next/navigation";
import { ProjectDetail } from "@/app/components/features/project/detail";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = params;

  // UUID validation
  const isValidUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (!isValidUUID) {
    notFound();
  }

  return (
    <main className="h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <ProjectDetail id={id} />
    </main>
  );
}
