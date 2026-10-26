// The original server-backed game remains available through the normal Vite mode.
// The dedicated offline build replaces only account/persistence endpoints.
export const OFFLINE_MODE = import.meta.env.MODE === 'offline';

export const publicAsset = (path: string): string =>
  OFFLINE_MODE ? `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}` : path;
