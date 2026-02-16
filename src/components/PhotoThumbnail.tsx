import { Capacitor } from '@capacitor/core';

interface PhotoThumbnailProps {
  uri: string;
  alt?: string;
  className?: string;
}

/**
 * Renders a photo thumbnail. On native Android, file:// URIs must be converted
 * via Capacitor.convertFileSrc() so the WebView can load them.
 */
export default function PhotoThumbnail({ uri, alt = 'Photo', className = '' }: PhotoThumbnailProps) {
  const isFileUri = uri.startsWith('file:') || uri.startsWith('content:');
  const src = Capacitor.isNativePlatform() && isFileUri ? Capacitor.convertFileSrc(uri) : uri;
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover rounded-xl bg-gray-100 ${className}`}
    />
  );
}
