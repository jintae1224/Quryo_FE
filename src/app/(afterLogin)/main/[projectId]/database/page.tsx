interface DatabasePageProps {
  params: {
    projectId: string;
  };
}

export default function DatabasePage({ params }: DatabasePageProps) {
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
          데이터베이스
        </h1>
        <p style={{ 
          color: "var(--muted-foreground)", 
          fontSize: "1.125rem" 
        }}>
          데이터 조회 및 관리 기능이 곧 추가될 예정입니다.
        </p>
        <div style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: "var(--muted)",
          borderRadius: "8px",
          color: "var(--muted-foreground)"
        }}>
          <p>프로젝트 ID: {params.projectId}</p>
          <p>여기에 테이블 데이터 조회, 레코드 관리 등의 기능이 구현됩니다.</p>
        </div>
      </div>
    </div>
  );
}