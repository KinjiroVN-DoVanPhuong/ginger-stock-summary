import { ref, onValue, off, get, push, set, update } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { AnalyseRequest } from '@/types/analysis';

const ANALYSE_REQUESTS_PATH = 'analyse_requests';

export const analysisService = {
    // Real-time listener for analysis requests
    subscribeToAnalyseRequests(callback: (requests: AnalyseRequest[]) => void) {
        const requestsRef = ref(database, ANALYSE_REQUESTS_PATH);

        const handleData = (snapshot: any) => {
            const data = snapshot.val();
            const requests: AnalyseRequest[] = [];

            if (data) {
                Object.keys(data).forEach((key) => {
                    requests.push({
                        id: key,
                        ...data[key]
                    });
                });
            }

            // Sort by created_at (newest first)
            requests.sort((a, b) => b.created_at - a.created_at);
            callback(requests);
        };

        onValue(requestsRef, handleData);

        // Return unsubscribe function
        return () => off(requestsRef, 'value', handleData);
    },

    // Get all analysis requests
    async getAnalyseRequests(): Promise<AnalyseRequest[]> {
        const requestsRef = ref(database, ANALYSE_REQUESTS_PATH);
        const snapshot = await get(requestsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.val();
        const requests: AnalyseRequest[] = [];

        Object.keys(data).forEach((key) => {
            requests.push({
                id: key,
                ...data[key]
            });
        });

        // Sort by created_at (newest first)
        requests.sort((a, b) => b.created_at - a.created_at);
        return requests;
    },

    // Create a new analysis request
    async createAnalyseRequest(symbol: string): Promise<string> {
        const requestsRef = ref(database, ANALYSE_REQUESTS_PATH);
        const newRequestRef = push(requestsRef);
        
        const request: AnalyseRequest = {
            symbol: symbol.toUpperCase(),
            status: 'request',
            result: '',
            created_at: Date.now()
        };

        await set(newRequestRef, request);
        return newRequestRef.key || '';
    },

    // Update an analysis request
    async updateAnalyseRequest(id: string, updates: Partial<AnalyseRequest>): Promise<void> {
        const requestRef = ref(database, `${ANALYSE_REQUESTS_PATH}/${id}`);
        
        const updateData: any = {
            ...updates,
            updated_at: Date.now()
        };

        await update(requestRef, updateData);
    },

    // Delete an analysis request
    async deleteAnalyseRequest(id: string): Promise<void> {
        const requestRef = ref(database, `${ANALYSE_REQUESTS_PATH}/${id}`);
        await set(requestRef, null);
    },

    // Get analysis request by ID
    async getAnalyseRequestById(id: string): Promise<AnalyseRequest | null> {
        const requestRef = ref(database, `${ANALYSE_REQUESTS_PATH}/${id}`);
        const snapshot = await get(requestRef);

        if (!snapshot.exists()) {
            return null;
        }

        return {
            id,
            ...snapshot.val()
        };
    },

    // Get analysis requests by symbol
    async getAnalyseRequestsBySymbol(symbol: string): Promise<AnalyseRequest[]> {
        const requests = await this.getAnalyseRequests();
        return requests.filter(request => 
            request.symbol.toLowerCase() === symbol.toLowerCase()
        );
    },

    // Get analysis requests by status
    async getAnalyseRequestsByStatus(status: AnalyseRequest['status']): Promise<AnalyseRequest[]> {
        const requests = await this.getAnalyseRequests();
        return requests.filter(request => request.status === status);
    },

    // Mark request as processing
    async markAsProcessing(id: string): Promise<void> {
        await this.updateAnalyseRequest(id, {
            status: 'processing'
        });
    },

    // Mark request as completed with result
    async markAsCompleted(id: string, result: string): Promise<void> {
        await this.updateAnalyseRequest(id, {
            status: 'completed',
            result
        });
    },

    // Mark request as failed
    async markAsFailed(id: string, error?: string): Promise<void> {
        await this.updateAnalyseRequest(id, {
            status: 'failed',
            result: error || 'Phân tích thất bại'
        });
    }
};