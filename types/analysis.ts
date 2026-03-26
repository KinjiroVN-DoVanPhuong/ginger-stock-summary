export interface AnalyseRequest {
    id?: string;
    symbol: string;
    status: 'request' | 'processing' | 'completed' | 'failed';
    result: string;
    created_at: number;
    updated_at?: number;
}