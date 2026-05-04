import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

/**
 * グローバルエラーバウンダリ
 * SECURITY-15: 未処理エラーのキャッチ
 */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 本番ではログサービスに送信（スタックトレースはユーザーに非表示）
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          data-testid="error-boundary-fallback"
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '32px',
          }}
        >
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>エラーが発生しました</h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            予期しないエラーが発生しました。ページを再読み込みしてください。
          </p>
          <button
            data-testid="error-boundary-reload-button"
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1a1a2e',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
