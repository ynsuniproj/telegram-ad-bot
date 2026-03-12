/**
 * In-memory session store for the two-step conversation flow.
 */

export interface UserSession {
    competitorImagePath: string;
    competitorFileId: string;
    // Use any here to avoid circular imports — the adPipeline casts it correctly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    designStyle: any | null;
    createdAt: number;
}

const sessions = new Map<number, UserSession>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export const setSession = (userId: number, session: UserSession): void => {
    sessions.set(userId, session);
};

export const getSession = (userId: number): UserSession | undefined => {
    const session = sessions.get(userId);
    if (!session) return undefined;
    // Expire old sessions
    if (Date.now() - session.createdAt > SESSION_TTL_MS) {
        sessions.delete(userId);
        return undefined;
    }
    return session;
};

export const clearSession = (userId: number): void => {
    sessions.delete(userId);
};
