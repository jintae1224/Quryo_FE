interface ChatbotPageProps {
  params: {
    projectId: string;
  };
}

export default function ChatbotPage({ params }: ChatbotPageProps) {
  return (
    <div style={{ 
      padding: "2rem", 
      height: "100%", 
      display: "flex", 
      flexDirection: "column" 
    }}>
      <div style={{ 
        textAlign: "center", 
        marginTop: "4rem" 
      }}>
        <h1 style={{ 
          fontSize: "2rem", 
          fontWeight: "bold", 
          color: "var(--foreground)",
          marginBottom: "1rem"
        }}>
          Chat Bot
        </h1>
        <p style={{ 
          color: "var(--muted-foreground)", 
          fontSize: "1.125rem" 
        }}>
          AI 챗봇과의 대화 기능이 곧 추가될 예정입니다.
        </p>
        <div style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: "var(--muted)",
          borderRadius: "8px",
          color: "var(--muted-foreground)"
        }}>
          <p>프로젝트 ID: {params.projectId}</p>
          <p>여기에 자연어로 데이터베이스 질의응답, SQL 생성 도움 등의 기능이 구현됩니다.</p>
        </div>
      </div>
    </div>
  );
}