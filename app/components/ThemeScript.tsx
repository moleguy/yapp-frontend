/** Runs before paint to avoid light flash when dark mode is stored. */
export default function ThemeScript() {
  const script = `
    (function () {
      try {
        var stored = localStorage.getItem('yapp-theme') || 'system';
        var dark =
          stored === 'dark' ||
          (stored === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (dark) document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
