export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  iconLink?: string;
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
  parents?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
  parents?: string[];
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface WatchHistoryItem {
  fileId: string;
  fileName: string;
  timestamp: number;
  duration: number;
  lastWatched: string;
  thumbnailLink?: string;
  mimeType?: string;
}

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
