import { ReactVideoSource, DRMType } from 'react-native-video';
import { safeHexToBase64, parseDrmUrl } from './validation';

export interface parseStreamProps {
    name: string;
    url: string;
    type: 'direct' | 'drm' | 'referer';
    header?: Record<string, string>;
}

export const parseServerStream = (activeServer: parseStreamProps): ReactVideoSource => {
    if (!activeServer) {
        console.error('Invalid server object passed to parseServerStream');
        return { uri: '' };
    }

    const cleanHeaders: Record<string, string> = {};
    if (activeServer.header && typeof activeServer.header === 'object') {
        Object.entries(activeServer.header).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                cleanHeaders[key] = String(value);
            }
        });
    }

    let streamUri = activeServer.url;
    let drmConfig: ReactVideoSource['drm'] = undefined;

    if (activeServer.type === 'drm') {
        const parsedDrm = parseDrmUrl(activeServer.url);

        if (parsedDrm) {
            streamUri = parsedDrm.url;

            if (parsedDrm.licenseKey) {
                try {
                    const kidHex = parsedDrm.licenseKey.split(':')[0];
                    const keyHex = parsedDrm.licenseKey.split(':')[1];

                    const kidBase64 = safeHexToBase64(kidHex);
                    const keyBase64 = safeHexToBase64(keyHex);

                    if (kidBase64 && keyBase64) {
                        drmConfig = {
                            type: 'clearkey' as DRMType,
                            licenseServer: `data:application/json;base64,${btoa(JSON.stringify({
                                keys: [
                                    {
                                        kty: 'oct',
                                        k: keyBase64,
                                        kid: kidBase64,
                                    },
                                ],
                            }))}`,
                        };
                    } else {
                        console.warn('Failed to parse DRM license key');
                    }
                } catch (error) {
                    console.error('Error parsing DRM configuration:', error);
                }
            }
        }
    }

    return {
        uri: streamUri,
        headers: cleanHeaders,
        drm: drmConfig,
    };
};