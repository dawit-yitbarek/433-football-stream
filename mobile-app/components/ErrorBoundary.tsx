import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorStack: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorStack: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorStack: error.stack || '',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorStack: '',
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-void">
          <ScrollView className="flex-1" contentContainerClassName="p-4">
            <View className="mt-8 mb-6">
              <Text className="text-2xl font-bold text-red-500 mb-2">Oops! Something went wrong</Text>
              <Text className="text-sm text-muted mb-4">
                An unexpected error occurred. Please try restarting the app.
              </Text>
            </View>

            <View className="bg-surface rounded-lg p-4 mb-6 border border-red-500/30">
              <Text className="text-xs font-mono text-red-400 mb-2">Error Details:</Text>
              <Text className="text-xs font-mono text-muted break-words">
                {this.state.error?.message}
              </Text>
            </View>

            {__DEV__ && this.state.errorStack && (
              <View className="bg-surface rounded-lg p-4 mb-6 border border-yellow-500/30">
                <Text className="text-xs font-mono text-yellow-400 mb-2">Stack Trace (Dev Only):</Text>
                <Text className="text-xs font-mono text-muted break-words">
                  {this.state.errorStack}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={this.resetError}
              className="bg-cyan rounded-lg py-3 px-4 items-center"
            >
              <Text className="text-center font-semibold text-void">Retry</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
