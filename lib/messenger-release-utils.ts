export function isNewerRelease(candidate: string, installed: string): boolean {
  const toParts = (version: string) => version.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const candidateParts = toParts(candidate);
  const installedParts = toParts(installed);
  const length = Math.max(candidateParts.length, installedParts.length);
  for (let index = 0; index < length; index += 1) {
    if ((candidateParts[index] ?? 0) !== (installedParts[index] ?? 0)) {
      return (candidateParts[index] ?? 0) > (installedParts[index] ?? 0);
    }
  }
  return false;
}
