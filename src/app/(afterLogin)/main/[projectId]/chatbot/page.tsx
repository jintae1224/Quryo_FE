import { ChatBot } from "./_components/ChatBot";

interface ChatBotPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ChatBotPage({ params }: ChatBotPageProps) {
  const { projectId } = await params;

  return <ChatBot projectId={projectId} />;
}