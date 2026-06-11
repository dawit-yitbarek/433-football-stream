import React, { createContext, useContext, useState, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import { useRouter, useNavigationContainerRef } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { API_CONFIG, fetchWithRetry } from '@/config/api';
import { validateMatchData } from '@/utils/validation';

// Define the type structure for a shared context state
export interface matchData {
    id: string;
    match_time: number;
    match_status: 'live' | 'vs';
    home_team_name: string;
    home_team_logo: string;
    homeTeamScore: string;
    away_team_name: string;
    away_team_logo: string;
    awayTeamScore: string;
    league_name: string;
    league_logo: string;
    servers: Array<{
        name: string;
        url: string;
        type: 'direct' | 'drm' | 'referer';
        header?: {
            'user-agent'?: string;
            'referer'?: string;
            [key: string]: string | undefined;
        };
    }>;
}

interface MatchesContextType {
    matches: matchData[] | [];
    leagues: string[] | [];
    scheduledMatchIds: string[];
    setScheduledMatchIds: Dispatch<SetStateAction<string[]>>;
    isLoading: boolean;
    error: string | null;
    filterMatchesByLeague: (league: string) => matchData[];
    getLiveMatches: (league: string) => matchData[];
    getUpcomingMatches: (league: string) => matchData[];
    refreshData: () => Promise<void>;
}

const MatchesContext = createContext<MatchesContextType | undefined>(undefined);

export const MatchesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [matches, setMatches] = useState<matchData[]>([]);
    const [leagues, setLeagues] = useState<string[]>(['All']);
    const [scheduledMatchIds, setScheduledMatchIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingRoute, setPendingRoute] = useState<string | null>(null);
    const router = useRouter()
    const rootNavigationRef = useNavigationContainerRef();
    const notificationListenerRef = useRef<any>(null);
    const isMountedRef = useRef(true);

    const fetchMatches = async () => {
        try {
            setIsLoading(true);
            const response = await fetchWithRetry(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATCHES}`,
                undefined,
                3, // max retries
                1000 // base delay
            );

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const availableMatches = await response.json();

            // Validate matches before setting state
            if (!Array.isArray(availableMatches)) {
                throw new Error('Invalid response format: expected array');
            }

            const validMatches = availableMatches.filter((match: any) => validateMatchData(match));

            const uniqueLeagues = ['All'];
            validMatches.forEach((match: matchData) => {
                if (!uniqueLeagues.includes(match.league_name)) {
                    uniqueLeagues.push(match.league_name);
                }
            });

            if (isMountedRef.current) {
                setLeagues([...uniqueLeagues]);
                setMatches(validMatches);
                console.log("Fetched matches:", validMatches.length);
                setError(null);
            }
        } catch (err: any) {
            console.error(`Frontend Context Fetch Error: ${err.message || err}`);
            if (isMountedRef.current) {
                setError('Connection error. Unable to find a match right now.');
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    };
    const fetchNotifications = async () => {
        // Fetches all pending notification items currently alive on the device OS
        const scheduledRequests = await Notifications.getAllScheduledNotificationsAsync();

        // Extract our custom match IDs from the identifiers
        const activeIds = scheduledRequests
            .map(request => request.identifier)
            .filter(id => id.startsWith('match-notif-'))
            .map(id => id.replace('match-notif-', ''));

        setScheduledMatchIds(activeIds);
    }
    const filterMatchesByLeague = (league: string) => {
        if (!matches) return [];
        if (league === 'All') return matches;
        return matches.filter(match => match.league_name === league);
    }
    const getLiveMatches = (league: string) => {
        if (!matches) return [];
        return matches.filter(match => {
            if (league === 'All') {
                return match.match_status === 'live';
            } else {
                return match.match_status === 'live' && match.league_name === league;
            };
        });
    };
    const getUpcomingMatches = (league: string) => {
        if (!matches) return [];
        return matches.filter(match => {
            if (league === 'All') {
                return match.match_status !== 'live';
            } else {
                return match.match_status !== 'live' && match.league_name === league;
            };
        });
    };

    useEffect(() => {
        // Priming fetch on app load
        isMountedRef.current = true;
        fetchMatches();
        fetchNotifications();

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
            const { actionIdentifier, notification } = response;

            const data = notification.request.content.data as {
                notificationId?: string;
                urlPath?: string;
                matchId?: string;
            };

            const targetNotifId = notification.request.identifier || data?.notificationId;

            if (!targetNotifId || typeof targetNotifId !== 'string') {
                console.log("Unable to find a valid notification identifier string.");
                return;
            }

            // Handle the "Dismiss" button click
            if (actionIdentifier === 'dismiss') {
                await Notifications.dismissNotificationAsync(targetNotifId);
                return;
            }

            // Handle Notification Body click or "Watch Live Now" action button click
            if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER || actionIdentifier === 'watch-live') {
                if (data?.urlPath) {
                    setPendingRoute(data.urlPath);
                    await Notifications.dismissNotificationAsync(targetNotifId);
                }
            }
        });

        notificationListenerRef.current = subscription;
        return () => {
            subscription.remove();
            notificationListenerRef.current = null;
        };
    }, []);

    // Separate effect for routing
    useEffect(() => {
        if (!pendingRoute) return;
        if (!rootNavigationRef?.isReady()) {
            return;
        }

        router.push(pendingRoute as any);
        setPendingRoute(null);
    }, [pendingRoute, router, rootNavigationRef]);

    return (
        <MatchesContext.Provider value={{ matches, leagues, scheduledMatchIds, setScheduledMatchIds, isLoading, error, filterMatchesByLeague, getLiveMatches, getUpcomingMatches, refreshData: fetchMatches }}>
            {children}
        </MatchesContext.Provider>
    );
};

// Custom hook to allow any page to instantly grab live match data
export const useMatches = () => {
    const context = useContext(MatchesContext);
    if (context === undefined) {
        throw new Error('useMatches must be used within a MatchesProvider');
    }
    return context;
};