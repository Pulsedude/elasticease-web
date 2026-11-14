import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * BackButton — shared back-navigation button used on all pages.
 * Uses browser history (navigate(-1)) so it always goes to the
 * last visited page regardless of route structure.
 *
 * Hidden when there is no real in-app history to go back to
 * (e.g. the first page after login or a fresh tab).
 * React-Router v6 stores the history stack index in
 * window.history.state.idx — 0 means first entry (nothing to go back to).
 */
export default function BackButton({ className = "" }) {
  const navigate = useNavigate();

  // idx === 0 (or missing) = first entry in the history stack, no back page
  const historyIdx = window.history.state?.idx ?? 0;
  if (historyIdx === 0) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={`back-btn ${className}`}
      aria-label="Go back to previous page"
      title="Go back"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Back
    </button>
  );
}