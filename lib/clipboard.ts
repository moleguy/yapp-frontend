/** Copy text from a user click handler (must stay synchronous for reliability). */
export function copyTextToClipboard(text: string): boolean {
  const value = text ?? "";
  if (!value) return false;

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, value.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }

  document.body.removeChild(textarea);

  if (!ok && navigator.clipboard?.writeText) {
    try {
      void navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  return ok;
}
