import Image from "next/image";

/**
 * The single image primitive. Renders an optimised next/image over a themed
 * gradient fallback (so it never looks broken if a remote photo is slow or
 * unavailable), with an optional bottom scrim for text legibility.
 *
 * The themed fallback uses the active --accent variables, so it harmonises
 * with whatever theme scope it sits in.
 */
export default function DestinationImage({
  src,
  alt,
  sizes,
  priority = false,
  scrim = true,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  scrim?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(135deg, var(--accent), var(--accent-deep))",
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : null}
      {scrim ? <div className="absolute inset-0 scrim-overlay" aria-hidden /> : null}
    </div>
  );
}
