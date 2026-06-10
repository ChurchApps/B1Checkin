import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./ErrorFallback";

const myErrorHandler = (_error: unknown) => {
  // Sentry is initialized globally in app/_layout.tsx and captures these automatically
};

const ErrorHandler = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary FallbackComponent={ErrorFallback} onError={myErrorHandler}>
    {children}
  </ErrorBoundary>
);
export default ErrorHandler;
