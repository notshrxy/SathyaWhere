/**
 * lib/facepp.ts
 * Shared utility for calling the Face++ API.
 */

export async function callFacePP(endpoint: string, params: Record<string, string>) {
    const apiKey = process.env.FACEPLUSPLUS_API_KEY;
    const apiSecret = process.env.FACEPLUSPLUS_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('Face++ API credentials are not configured.');
    }

    const querystring = new URLSearchParams({
        api_key: apiKey,
        api_secret: apiSecret,
        ...params
    });

    const response = await fetch(`https://api-us.faceplusplus.com/facepp/v3/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: querystring.toString(),
    });

    const data = await response.json();

    if (data.error_message) {
        throw new Error(`Face++ API Error: ${data.error_message}`);
    }

    return data;
}
