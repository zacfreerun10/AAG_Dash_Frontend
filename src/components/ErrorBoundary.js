import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🛑 Caught Error in Component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h2>⚠️ Something went wrong while loading this component.</h2>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;