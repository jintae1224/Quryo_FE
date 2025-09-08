import DatabaseStructure from "./_components/DatabaseStructure";

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return <DatabaseStructure projectId={params.projectId} />;
}
