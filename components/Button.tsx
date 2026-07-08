import type { ButtonHTMLAttributes } from "react";

/**
 * Button — deliberately monochrome. Color is reserved for verdicts, so the
 * primary action is high-contrast bone/ink, never a brand-colored CTA.
 */
type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  // accent fill — the app's single interactive color
  primary:
    "bg-fg text-canvas hover:opacity-90 disabled:bg-elevate disabled:text-faint",
  secondary:
    "bg-transparent text-fg border border-line hover:border-fg/40 disabled:text-faint disabled:border-line",
  ghost:
    "bg-transparent text-muted hover:text-fg disabled:text-faint",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-pill",
  md: "h-11 px-5 text-[15px] rounded-pill",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-sans font-semibold transition disabled:cursor-not-allowed ${SIZE[size]} ${VARIANT[variant]} ${className}`}
      {...props}
    />
  );
}
