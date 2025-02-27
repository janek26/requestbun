export interface Request {
  id: string;
  projectId: string;
  method: string;
  query: Record<string, any> | null;
  headers: Record<string, string> | null;
  body: any;
  ip: string | null;
  timestamp: Date;
}

export interface RequestsResponse {
  requests: Request[];
  total: number;
}
