import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error without exposing PII/tokens
    console.error('[ErrorBoundary]', error.message, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
            backgroundColor: '#F8FAFC',
          }}
        >
          <AlertTriangle size={56} color="#EF4444" />
          <Text
            style={{
              fontSize: 22,
              fontFamily: 'Outfit-Bold',
              color: '#1E293B',
              marginTop: 20,
              textAlign: 'center',
            }}
          >
            Đã xảy ra lỗi
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Inter',
              color: '#64748B',
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            Ứng dụng gặp sự cố không mong muốn.{'\n'}Vui lòng thử lại.
          </Text>
          {this.state.error?.message ? (
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter',
                color: '#94A3B8',
                marginTop: 12,
                textAlign: 'center',
              }}
              numberOfLines={3}
            >
              {this.state.error.message}
            </Text>
          ) : null}
          <TouchableOpacity
            onPress={this.handleRetry}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#2563EB',
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 16,
              marginTop: 28,
            }}
          >
            <RefreshCw size={18} color="#FFFFFF" />
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: 'Inter-Bold',
                fontSize: 15,
                marginLeft: 8,
              }}
            >
              Thử lại
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
