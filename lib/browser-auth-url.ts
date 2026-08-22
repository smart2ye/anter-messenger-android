export function buildBrowserAuthorizationUrl(baseUrl: string, redirectUri: string, state: string): string {
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/auth/messenger/authorize`);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("device_name", "ANTER Messenger Android");
  return url.toString();
}
