interface SqlEditorPageProps {
  params: {
    projectId: string;
  };
}

export default function SqlEditorPage({ params }: SqlEditorPageProps) {
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
          SQL Editor
        </h1>
        <p style={{ 
          color: "var(--muted-foreground)", 
          fontSize: "1.125rem" 
        }}>
          SQL 쿼리 작성 및 실행 기능이 곧 추가될 예정입니다.
        </p>
        <div style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: "var(--muted)",
          borderRadius: "8px",
          color: "var(--muted-foreground)"
        }}>
          <p>프로젝트 ID: {params.projectId}</p>
          <p>여기에 SQL 에디터, 쿼리 실행, 결과 조회, 쿼리 저장 등의 기능이 구현됩니다.</p>
        </div>
      </div>
    </div>
  );
}