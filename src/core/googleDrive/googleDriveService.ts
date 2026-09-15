import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize or reuse Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Workspace Drive scope configured per metadata
provider.addScope('https://www.googleapis.com/auth/drive.file');
// Force Google account picker so users can select or switch accounts
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink?: string;
  mimeType: string;
}

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleDriveSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh access token Google Drive dari autentikasi.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      const cancelError = new Error('Autentikasi Google Drive dibatalkan (jendela ditutup).');
      (cancelError as any).code = error.code;
      (cancelError as any).isCancelled = true;
      throw cancelError;
    } else if (error?.code === 'auth/popup-blocked') {
      const blockedError = new Error(
        'Pop-up Google diblokir oleh peramban. Silakan izinkan pop-up atau buka aplikasi di tab baru.'
      );
      (blockedError as any).code = error.code;
      throw blockedError;
    }

    console.warn('Google Drive sign in notice:', error?.message || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getDriveUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

export const googleDriveSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};

/**
 * Helper to ensure a dedicated folder exists in Google Drive
 */
async function getOrCreateCoaFolder(token: string): Promise<string | null> {
  try {
    const folderName = 'CPKB - Dokumen CoA';
    const query = encodeURIComponent(
      `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );

    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Create folder if not found
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (createRes.ok) {
      const folder = await createRes.json();
      return folder.id;
    }
  } catch (err) {
    console.warn('Could not create dedicated folder in Drive, using root:', err);
  }
  return null;
}

/**
 * Upload file directly to Google Drive via multipart upload
 */
export const uploadCoaFileToDrive = async (
  file: File,
  metadata: {
    grnNumber?: string;
    materialName?: string;
    batchNumber?: string;
  }
): Promise<DriveUploadResult> => {
  let token = await getDriveAccessToken();
  if (!token) {
    // Attempt sign in if not currently signed in
    const authResult = await googleDriveSignIn();
    token = authResult.accessToken;
  }

  const folderId = await getOrCreateCoaFolder(token);

  // Construct formatted descriptive filename for CPKB record
  const ext = file.name.split('.').pop() || 'pdf';
  const cleanBatch = metadata.batchNumber ? `_Batch-${metadata.batchNumber}` : '';
  const cleanGrn = metadata.grnNumber ? `[${metadata.grnNumber}]_` : '';
  const driveFileName = `${cleanGrn}CoA_${metadata.materialName || 'Bahan'}${cleanBatch}.${ext}`.replace(
    /[\/\\]/g,
    '-'
  );

  const fileMetadata: Record<string, any> = {
    name: driveFileName,
    description: `Sertifikat Analisis (CoA) Mutu CPKB untuk GRN ${metadata.grnNumber || '-'} (${metadata.materialName || '-'}). Batch: ${metadata.batchNumber || '-'}`,
  };

  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Read file as binary array buffer
  const fileData = await file.arrayBuffer();
  const fileBytes = new Uint8Array(fileData);

  // Build multipart payload
  const metadataString = JSON.stringify(fileMetadata);
  const multipartHeader =
    `${delimiter}` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadataString}` +
    `${delimiter}` +
    `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

  const headerBytes = new TextEncoder().encode(multipartHeader);
  const footerBytes = new TextEncoder().encode(closeDelimiter);

  const combinedBody = new Uint8Array(
    headerBytes.length + fileBytes.length + footerBytes.length
  );
  combinedBody.set(headerBytes, 0);
  combinedBody.set(fileBytes, headerBytes.length);
  combinedBody.set(footerBytes, headerBytes.length + fileBytes.length);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combinedBody,
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Gagal mengunggah file ke Google Drive: ${uploadRes.status} ${errorText}`);
  }

  const uploaded = await uploadRes.json();

  return {
    fileId: uploaded.id,
    fileName: uploaded.name || driveFileName,
    webViewLink:
      uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view?usp=drivesdk`,
    webContentLink: uploaded.webContentLink,
    mimeType: uploaded.mimeType || file.type,
  };
};
