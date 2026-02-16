/**
 * Camera service – wraps Capacitor Camera for group photo and individual photos.
 * Returns URIs (path or webPath) to store in SQLite and display.
 */
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/** Request permissions; call before capture/pick if needed */
export async function requestCameraPermissions(): Promise<boolean> {
  try {
    const status = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    return status.photos === 'granted' && (status.camera === 'granted' || status.camera === 'prompt');
  } catch {
    return false;
  }
}

/** Take a single group photo (camera). Returns URI string for storage. */
export async function takeGroupPhoto(): Promise<string | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });
    return photo.path ?? photo.webPath ?? null;
  } catch {
    return null;
  }
}

/** Pick multiple individual photos from gallery. Returns array of URI strings. */
export async function pickIndividualPhotos(limit: number = 10): Promise<string[]> {
  try {
    const result = await Camera.pickImages({ limit, quality: 90 });
    const uris: string[] = [];
    for (const p of result.photos) {
      const uri = p.path ?? p.webPath;
      if (uri) uris.push(uri);
    }
    return uris;
  } catch {
    return [];
  }
}
