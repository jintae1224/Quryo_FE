import { SqlEditor } from "./_components/SqlEditor";

interface SqlEditorPageProps {
  params: {
    projectId: string;
  };
}

export default function SqlEditorPage({ params }: SqlEditorPageProps) {
  return <SqlEditor projectId={params.projectId} />;
}
