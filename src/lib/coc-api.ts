const COC_API_BASE_URL = 'https://api.clashofclans.com/v1';
const CLASH_OF_CLANS_API_TOKEN = process.env.CLASH_OF_CLANS_API_TOKEN;

async function fetchCocApi(path: string) {
    if (!CLASH_OF_CLANS_API_TOKEN) {
        throw new Error('Clash of Clans API token is not configured.');
    }

    const url = `${COC_API_BASE_URL}${path}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${CLASH_OF_CLANS_API_TOKEN}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
            console.error('Clash of Clans API Error:', {
                status: response.status,
                statusText: response.statusText,
                url: url,
                errorData: errorData
            });
            throw new Error(`Failed to fetch data from Clash of Clans API: ${response.status} ${response.statusText}. Reason: ${errorData.reason || 'Unknown'}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching from Clash of Clans API', error);
        // Re-throw the error to be caught by the caller
        throw error;
    }
}

export async function getPlayerInfo(playerTag: string) {
    // Player tags need to be URL encoded, especially the '#' character.
    const encodedPlayerTag = encodeURIComponent(playerTag);
    return fetchCocApi(`/players/${encodedPlayerTag}`);
}

export async function getClanInfo(clanTag: string) {
    const encodedClanTag = encodeURIComponent(clanTag);
    return fetchCocApi(`/clans/${encodedClanTag}`);
}

export async function getClanMembers(clanTag: string) {
    const encodedClanTag = encodeURIComponent(clanTag);
    return fetchCocApi(`/clans/${encodedClanTag}/members`);
}

export async function getClanWarLog(clanTag: string) {
    const encodedClanTag = encodeURIComponent(clanTag);
    return fetchCocApi(`/clans/${encodedClanTag}/warlog`);
}

export async function getCurrentWar(clanTag: string) {
    const encodedClanTag = encodeURIComponent(clanTag);
    return fetchCocApi(`/clans/${encodedClanTag}/currentwar`);
} 