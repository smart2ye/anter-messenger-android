export function buildMobileApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/api/mobile/v1${path}`;
}

