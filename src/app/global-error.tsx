"use client";

// Last-resort error screen, used only if the root layout itself fails.
// It replaces the whole page, so it can't rely on our fonts or styles.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF8F1",
          color: "#1A1D1B",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <p style={{ letterSpacing: "0.15em", textTransform: "uppercase", fontSize: 12, color: "#2F6B4F" }}>
            DeltaWay
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 40, margin: "16px 0" }}>
            We&rsquo;ll be right back.
          </h1>
          <p style={{ lineHeight: 1.6, color: "#3B4340" }}>
            The site hit an unexpected problem. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#1B3D2F",
              color: "#FAF8F1",
              border: 0,
              borderRadius: 9999,
              padding: "12px 24px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: 24, fontSize: 12, color: "#6B7570" }}>Error reference: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
