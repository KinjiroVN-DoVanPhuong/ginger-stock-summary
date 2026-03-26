export interface AnalyseRequest {
    id?: string;
    symbol: string;
    status: 'request' | 'running' | 'error' | 'done';
    result: string;
    created_at: number;
    updated_at?: number;
}
