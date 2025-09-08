"use client";

import { ReactNode, use } from "react";

import ProjectLnb from "@/app/_components/ProjectLnb/ProjectLnb";
import { useProjectDetail } from "@/hooks/projects/useProjectDetail";

interface ProjectLayoutProps {
  children: ReactNode;
  params: Promise<{
    projectId: string;
  }>;
}

export default function ProjectLayout({ 
  children, 
  params 
}: ProjectLayoutProps) {
  const { projectId } = use(params);
  const { data: project } = useProjectDetail(projectId);
  
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ProjectLnb 
        projectId={projectId}
        projectName={project?.project_name}
        projectDescription={project?.description}
      />
      <main style={{ flex: 1, overflow: "hidden" }}>
        {children}
      </main>
    </div>
  );
}