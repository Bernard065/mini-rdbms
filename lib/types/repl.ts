export interface QueryHistoryItem {
  query: string;
  result: string;
  timestamp: Date;
  executionTime?: number;
}

export interface REPLTerminalProps {
  onDataChanged?: () => void;
}
