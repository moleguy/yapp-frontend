"use client";

import React from "react";
import ChatArea from "./ChatArea";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          Chat failed to load
        </div>
      );
    }

    return this.props.children;
  }
}

type Props = {
  serverName?: string;
  channelName?: string;
  hallId?: string;
  roomId?: string;
  friendDisplayName?: string;
  friendId?: string;
  isDm: boolean;
};

function ChatAreaContent(props: Props) {
  return <ChatArea {...props} />;
}

export default function ChatAreaIntegrated(props: Props) {
  return (
    <ErrorBoundary>
      <ChatAreaContent {...props} />
    </ErrorBoundary>
  );
}