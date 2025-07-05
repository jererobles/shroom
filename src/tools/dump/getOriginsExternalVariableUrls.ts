import { parseOriginsExternalVariables, extractOriginsVariables, OriginsExternalVariables } from "./parseOriginsExternalVariables";
import fetch from "node-fetch";

export async function getOriginsExternalVariableUrls(
  externalVariablesUrl: string
): Promise<OriginsExternalVariables> {
  const externalVariablesString = await fetch(
    externalVariablesUrl
  ).then((res) => res.text());
  
  const parsed = parseOriginsExternalVariables(externalVariablesString);
  const variables = extractOriginsVariables(parsed);

  // Validate required URLs
  if (!variables.flashDynamicDownloadUrl) {
    throw new Error("Invalid flash.dynamic.download.url");
  }
  if (!variables.externalFigurepartlistUrl) {
    throw new Error("Invalid external.figurepartlist.txt url");
  }

  return variables;
} 