import { useRouteLoaderData } from "react-router";

type RootData = {
  publicConfig?: {
    turnstileSiteKey?: string;
  };
};

export function TurnstileWidget() {
  const data = useRouteLoaderData("root") as RootData | undefined;
  const siteKey = data?.publicConfig?.turnstileSiteKey;
  if (!siteKey) return null;
  return (
    <>
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-action="turnstile-spin-v2" />
    </>
  );
}

export function getTurnstileToken() {
  if (typeof document === "undefined") return "";
  return (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value || "";
}
