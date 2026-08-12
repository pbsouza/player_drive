import { DriveFile, DriveFolder } from "../types";

const DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files";

export async function listDriveItems(
  accessToken: string,
  folderId: string = "root",
  searchQuery: string = ""
): Promise<{ files: DriveFile[]; folders: DriveFolder[] }> {
  try {
    let q = "";
    if (searchQuery.trim()) {
      const sanitized = searchQuery.trim().replace(/'/g, "\\'");
      q = `trashed = false and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'video/') and name contains '${sanitized}'`;
    } else {
      q = `trashed = false and '${folderId}' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'video/')`;
    }

    const fields = "files(id, name, mimeType, size, modifiedTime, thumbnailLink, iconLink, videoMediaMetadata, parents)";
    const orderBy = "folder,name";
    const pageSize = 100;

    const url = `${DRIVE_API_URL}?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(
      fields
    )}&orderBy=${encodeURIComponent(orderBy)}&pageSize=${pageSize}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error?.message || `Erro do Google Drive (${res.status})`);
    }

    const data = await res.json();
    const rawItems: DriveFile[] = data.files || [];

    const folders: DriveFolder[] = rawItems
      .filter((item) => item.mimeType === "application/vnd.google-apps.folder")
      .map((item) => ({
        id: item.id,
        name: item.name,
        parents: item.parents,
      }));

    const files: DriveFile[] = rawItems.filter(
      (item) => item.mimeType !== "application/vnd.google-apps.folder"
    );

    return { files, folders };
  } catch (err: any) {
    if (err?.message !== "UNAUTHORIZED") {
      console.error("Erro ao listar itens do Google Drive:", err?.message || String(err));
    }
    throw err;
  }
}

export async function getFolderDetails(
  accessToken: string,
  folderId: string
): Promise<{ id: string; name: string; parents?: string[] }> {
  if (folderId === "root") {
    return { id: "root", name: "Meu Drive" };
  }

  try {
    const url = `${DRIVE_API_URL}/${folderId}?fields=id,name,parents`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return { id: folderId, name: "Pasta" };
    }

    const data = await res.json();
    return { id: data.id, name: data.name, parents: data.parents };
  } catch (err) {
    return { id: folderId, name: "Pasta" };
  }
}

export function formatDuration(millisStr?: string): string {
  if (!millisStr) return "";
  const millis = parseInt(millisStr, 10);
  if (isNaN(millis)) return "";

  const totalSeconds = Math.floor(millis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

export function formatFileSize(bytesStr?: string): string {
  if (!bytesStr) return "";
  const bytes = parseInt(bytesStr, 10);
  if (isNaN(bytes) || bytes === 0) return "";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
