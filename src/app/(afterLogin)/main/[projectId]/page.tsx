import { redirect } from "next/navigation";

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  // 기본적으로 structure 탭으로 리다이렉트
  redirect(`/main/${params.projectId}/structure`);
}