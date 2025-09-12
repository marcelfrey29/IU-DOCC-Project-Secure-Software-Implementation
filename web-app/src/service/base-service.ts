export interface UserContext {
    accessToken?: string;
}

export class BaseAPIService {
    protected readonly BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

    protected getHeaders(context: UserContext): Record<string, string> {
        const headers: Record<string, string> = {};
        if (context.accessToken) {
            headers.authorization = `Bearer ${context.accessToken}`;
        }
        return headers;
    }
}
