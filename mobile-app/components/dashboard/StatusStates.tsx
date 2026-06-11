import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
}

interface EmptyStateProps {
    onRefresh?: () => void;
}

// Empty State for no matches
export function EmptyMatchesState({ onRefresh }: EmptyStateProps) {
    return (
        <View className="flex-1 bg-void items-center justify-center px-6 py-12">

            <View className="h-16 w-16 bg-surface-elevated items-center justify-center rounded-full mb-5 border border-border">
                <FontAwesome name="calendar-o" size={22} color="#8B90A0" />
            </View>

            <Text className="text-white text-lg font-bold text-center mb-2">
                No Matches Scheduled
            </Text>

            <Text className="text-muted text-sm text-center mb-8 max-w-xs leading-5">
                There are no live or upcoming matches available right now. Check back later!
            </Text>

            {onRefresh && (
                <TouchableOpacity
                    onPress={onRefresh}
                    activeOpacity={0.8}
                    className="flex-row items-center bg-surface-elevated border border-border px-5 py-3 rounded-xl active:border-cyan"
                >
                    <FontAwesome name="refresh" size={13} color="#8B90A0" />
                    <Text className="text-white font-semibold text-sm ml-2.5">
                        Check for Updates
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}


// Loading State Spinner
export function LoadingState() {
    return (
        <View className="flex-1 bg-void items-center justify-center px-6">
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text className="text-muted font-medium mt-4 text-center">
                Fetching matches...
            </Text>
        </View>
    );
}

// Error State
export function ErrorState({ message, onRetry }: ErrorStateProps) {
    return (
        <View className="flex-1 bg-void items-center justify-center px-6">
            <View className="h-16 w-16 bg-surface-elevated items-center justify-center rounded-full mb-4 border border-border">
                <FontAwesome name="exclamation-triangle" size={24} color="#FF5252" />
            </View>

            <Text className="text-white text-lg font-bold text-center mb-2">
                Fetching matches Failed
            </Text>

            <Text className="text-muted text-sm text-center mb-6 max-w-xs">
                {message || "We couldn't fetch matches. Please check your network connection."}
            </Text>

            {onRetry && (
                <TouchableOpacity
                    onPress={onRetry}
                    activeOpacity={0.8}
                    className="flex-row items-center bg-surface-elevated border border-cyan px-6 py-3 rounded-xl"
                >
                    <FontAwesome name="refresh" size={14} color="#00E5FF" className="mr-2" />
                    <Text className="text-cyan font-bold text-sm ml-2">
                        Retry
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}