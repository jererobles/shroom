import fetch from "node-fetch";

export interface OriginsClientUrls {
  "shockwave-windows-version": string;
  "shockwave-windows": string;
  "shockwave-mac-version"?: string;
  "shockwave-mac"?: string;
  [key: string]: any;
}

export async function getOriginsClientUrls(
  clientUrlsEndpoint: string = "https://origins.habbo.com/gamedata/clienturls"
): Promise<OriginsClientUrls> {
  try {
    const response = await fetch(clientUrlsEndpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch client URLs: ${response.status} ${response.statusText}`);
    }
    
    const clientUrls = await response.json() as OriginsClientUrls;
    
    // Validate required fields
    if (!clientUrls["shockwave-windows-version"]) {
      throw new Error("Missing shockwave-windows-version in client URLs");
    }
    if (!clientUrls["shockwave-windows"]) {
      throw new Error("Missing shockwave-windows URL in client URLs");
    }
    
    return clientUrls;
  } catch (error) {
    throw new Error(`Failed to get Origins client URLs: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function getLatestClientInfo(clientUrls: OriginsClientUrls) {
  return {
    version: clientUrls["shockwave-windows-version"],
    downloadUrl: clientUrls["shockwave-windows"],
    platform: "windows",
  };
} 