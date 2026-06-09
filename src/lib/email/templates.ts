import { siteConfig } from "@/config/site";

/**
 * Lightweight, dependency-free HTML email templates. Inline styles only (email
 * clients ignore <style>/external CSS). React Email components can replace these
 * in a later phase if richer composition is needed.
 */
const BRAND = "#8E2741"; // rosewood
const INK = "#1f1d22";
const MUTED = "#6b6770";

function shell(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#faf8f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK}">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:22px;font-weight:700;color:${BRAND};letter-spacing:-0.02em">${siteConfig.name}</span>
    </div>
    <div style="background:#ffffff;border:1px solid #ece8e4;border-radius:16px;padding:32px 28px">
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:${INK}">${title}</h1>
      ${body}
    </div>
    <p style="text-align:center;color:${MUTED};font-size:12px;margin-top:24px">
      ${siteConfig.name} · ${siteConfig.tagline}
    </p>
  </div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;
    padding:13px 22px;border-radius:9999px;font-weight:600;font-size:15px">${label}</a>`;
}

export function magicLinkEmail(url: string): { subject: string; html: string; text: string } {
  const subject = `Sign in to ${siteConfig.name}`;
  const html = shell(
    `Sign in to ${siteConfig.name}`,
    `<p style="color:${MUTED};font-size:15px;line-height:1.6;margin:0 0 24px">
       Click the button below to sign in. This link expires in 24 hours and can only be used once.
     </p>
     <div style="text-align:center;margin:8px 0 24px">${button(url, "Sign in")}</div>
     <p style="color:${MUTED};font-size:13px;line-height:1.6;margin:0">
       If you didn't request this, you can safely ignore this email.
     </p>`,
  );
  const text = `Sign in to ${siteConfig.name}: ${url}\n\nThis link expires in 24 hours. If you didn't request it, ignore this email.`;
  return { subject, html, text };
}
