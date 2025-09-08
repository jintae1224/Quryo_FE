import DatabaseData from "./_components/DatabaseData";

interface DatabasePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { projectId } = await params;
  return <DatabaseData projectId={projectId} />;
}