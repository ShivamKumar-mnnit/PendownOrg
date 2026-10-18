import { Component } from "react";

/**
 * Catches a crash while drawing a page, so the visitor sees a message and a reload button
 * instead of a blank screen. Keyed by the route in Layout, so moving to another page resets it.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="page">
        <div className="wrap" style={{ maxWidth: 560 }}>
          <h1 style={{ fontSize: 28 }}>Something went wrong on this page</h1>
          <p className="note">Reload to try again. Your saved work is kept.</p>
          <div className="row" style={{ marginTop: 14 }}>
            <button type="button" className="btn" onClick={() => window.location.reload()}>
              Reload the page
            </button>
            <a className="btn ghost" href="/">
              Go to home
            </a>
          </div>
          <details style={{ marginTop: 18 }}>
            <summary className="note" style={{ cursor: "pointer" }}>
              Error details
            </summary>
            <pre className="out" style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{String(this.state.error?.message || this.state.error)}</pre>
          </details>
        </div>
      </section>
    );
  }
}
