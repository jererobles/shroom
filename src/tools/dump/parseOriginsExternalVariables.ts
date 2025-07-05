export function parseOriginsExternalVariables(externalVars: string) {
  const lines = externalVars.split("\n");
  const variables = new Map<string, string>();
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue; // Skip empty lines and comments
    }
    
    const equalIndex = trimmedLine.indexOf("=");
    if (equalIndex === -1) {
      continue; // Skip lines without equals sign
    }
    
    const key = trimmedLine.substring(0, equalIndex).trim();
    const value = trimmedLine.substring(equalIndex + 1).trim();
    variables.set(key, value);
  }

  // Resolve variable references (${variable} format)
  variables.forEach((replaceValue, key) => {
    variables.forEach((value, okey) => {
      if (value && value.includes("${")) {
        const resolved = value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
          return variables.get(varName) || match;
        });
        variables.set(okey, resolved);
      }
    });
  });

  return variables;
}

export interface OriginsExternalVariables {
  flashDynamicDownloadUrl?: string;
  externalTextsUrl?: string;
  externalFigurepartlistUrl?: string;
  externalOverrideTextsUrl?: string;
  castEntries: Map<string, string>;
  roomCasts: Map<string, string>;
  imageLibraryUrl?: string;
}

export function extractOriginsVariables(variables: Map<string, string>): OriginsExternalVariables {
  const castEntries = new Map<string, string>();
  const roomCasts = new Map<string, string>();
  
  // Extract cast entries
  variables.forEach((value, key) => {
    if (key.startsWith("cast.entry.")) {
      const entryNumber = key.replace("cast.entry.", "");
      castEntries.set(entryNumber, value);
    } else if (key.startsWith("room.cast.")) {
      const castNumber = key.replace("room.cast.", "");
      roomCasts.set(castNumber, value);
    }
  });

  return {
    flashDynamicDownloadUrl: variables.get("flash.dynamic.download.url"),
    externalTextsUrl: variables.get("external.texts.txt"),
    externalFigurepartlistUrl: variables.get("external.figurepartlist.txt"),
    externalOverrideTextsUrl: variables.get("external.override.texts.txt"),
    imageLibraryUrl: variables.get("image.library.url"),
    castEntries,
    roomCasts,
  };
} 