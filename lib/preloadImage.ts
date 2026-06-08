/** Poll until a remote image URL can be loaded in the browser. */
export async function preloadImage(
  url: string,
  { attempts = 12, intervalMs = 400 }: { attempts?: number; intervalMs?: number } = {},
): Promise<boolean> {
  if (!url || url.startsWith("blob:")) return true;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const loaded = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      const separator = url.includes("?") ? "&" : "?";
      img.src = `${url}${separator}preload=${Date.now()}`;
    });

    if (loaded) return true;
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  return false;
}
