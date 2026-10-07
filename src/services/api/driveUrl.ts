/**
 * Helper to convert Google Drive sharing links to direct image thumbnail URLs
 * for rendering inside React Native Image and expo-image components.
 */
export function getDriveDirectImageUrl(driveUrl?: string | null): string | undefined {
  if (!driveUrl) return undefined;
  const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || driveUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return driveUrl;
}

export const getDriveImageUrl = getDriveDirectImageUrl;
