import { getTheme, themeVars } from "@/lib/theme";

/**
 * Sets the destination accent variables on a wrapper so everything inside
 * inherits the theme. Server component — used by statically themed pages
 * (playbooks, guides). The home hero themes live via its own client wrapper.
 */
export default function ThemeScope({
  slug,
  className = "",
  children,
}: {
  slug?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const theme = getTheme(slug);
  return (
    <div style={themeVars(theme)} className={className}>
      {children}
    </div>
  );
}
