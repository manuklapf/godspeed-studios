import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";

const EMAIL = "collab@godspeed-studios.com";

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function EmailSendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ContactModal({ onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(EMAIL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const handleBackdrop = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(
    <div className="contact-backdrop" onClick={handleBackdrop}>
      <div
        className="contact-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Contact"
      >
        <button className="contact-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        <span className="contact-eyebrow">Contact</span>
        <h2 className="contact-title">Get in touch</h2>

        <p className="contact-body">
          For inquiries, business contacts or to connect in any way:
        </p>

        <div className="contact-details">
          <p className="contact-line">Manuel Klapfenberger</p>
          <p className="contact-line">
            Klosterstr. 11, 83278 Traunstein, Germany
          </p>
          <p className="contact-line contact-line--email">
            {EMAIL}
            <button
              className="contact-icon-btn"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy email address"}
              title={copied ? "Copied!" : "Copy to clipboard"}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </p>
          <p className="contact-line">+49 176 459 26292</p>
        </div>

        <p className="contact-legal">
          This site is operated by Manuel Klapfenberger as a personal portfolio.
          No personal data is collected or stored. Contact information above is
          provided solely for professional communication purposes.
        </p>

        <a
          className="contact-send-btn"
          href={`mailto:${EMAIL}`}
          aria-label="Send email"
        >
          <EmailSendIcon />
          <span>Send email</span>
        </a>
      </div>
    </div>,
    document.body,
  );
}
