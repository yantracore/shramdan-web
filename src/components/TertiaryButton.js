"use client";

import Link from "next/link";
import { forwardRef } from "react";

// Shared "tertiary / utility" button — outlined pill chassis with a
// leading-icon slot and a label. Use for: Back navigation, Print,
// Filter, Export, View All, and other secondary utility actions.
// NOT for screen-level CTAs (those stay primary AntD Button) or
// destructive actions (still TBD).
//
// Renders as <Link> when `href` is provided, otherwise <button>.
// Inherits all native attributes via …rest.

export const TertiaryButton = forwardRef(function TertiaryButton(
  {
    icon,
    children,
    href,
    onClick,
    type = "button",
    className = "",
    iconPosition = "leading",
    ...rest
  },
  ref
) {
  const cls = `tertiary-button${
    iconPosition === "trailing" ? " tertiary-button--icon-trailing" : ""
  }${className ? ` ${className}` : ""}`;
  const iconEl = icon ? (
    <span className="tertiary-button-icon" aria-hidden="true">
      {icon}
    </span>
  ) : null;
  const body = (
    <>
      {iconPosition === "leading" ? iconEl : null}
      <span className="tertiary-button-label">{children}</span>
      {iconPosition === "trailing" ? iconEl : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls} ref={ref} {...rest}>
        {body}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cls} ref={ref} {...rest}>
      {body}
    </button>
  );
});
