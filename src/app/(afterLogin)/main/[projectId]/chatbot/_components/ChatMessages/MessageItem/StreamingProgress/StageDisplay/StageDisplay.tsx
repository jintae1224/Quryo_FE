"use client";

import {
  ChatBotStreamingResponse,
  ColumnSelectionData,
  CompletedData,
  ForeignKeyAnalysisData,
  SqlGenerationData,
  TableSelectionData,
} from "@/types/chatbot";

import { ColumnSelectionDisplay } from "./StageDisplayType/ColumnSelectionDisplay";
import { CompletedDisplay } from "./StageDisplayType/CompletedDisplay";
import { ForeignKeyAnalysisDisplay } from "./StageDisplayType/ForeignKeyAnalysisDisplay";
import { SqlGenerationDisplay } from "./StageDisplayType/SqlGenerationDisplay";
import { TableSelectionDisplay } from "./StageDisplayType/TableSelectionDisplay";

interface StageDisplayProps {
  stage: ChatBotStreamingResponse["stage"];
  data:
    | TableSelectionData
    | ColumnSelectionData
    | ForeignKeyAnalysisData
    | SqlGenerationData
    | CompletedData;
}

export function StageDisplay({ stage, data }: StageDisplayProps) {
  if (!data) return null;

  switch (stage) {
    case "table_selection":
      return <TableSelectionDisplay data={data as TableSelectionData} />;
    case "column_selection":
      return <ColumnSelectionDisplay data={data as ColumnSelectionData} />;
    case "foreign_key_analysis":
      return (
        <ForeignKeyAnalysisDisplay data={data as ForeignKeyAnalysisData} />
      );
    case "sql_generation":
      return <SqlGenerationDisplay data={data as SqlGenerationData} />;
    case "completed":
      return <CompletedDisplay data={data as CompletedData} />;
    default:
      return null;
  }
}
