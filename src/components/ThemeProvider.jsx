import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * ThemeProvider Component
 * 
 * Wraps app with theme support (light/dark mode).
 * Defaults to dark mode.
 */
export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}