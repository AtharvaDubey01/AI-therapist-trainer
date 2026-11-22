import { readFile } from "fs/promises";
import path from "path";

/**
 * promptBuilder.ts — The ONLY place that reads .md files from /prompts.
 *
 * Every route (chat, hint, evaluate, personas/generate) calls this shared
 * utility rather than each implementing its own file-reading/templating logic.
 * See architecture.md §4 for this structural rule.
 *
 * Template syntax: {{VARIABLE_NAME}} placeholders in .md files are replaced
 * with the corresponding value from the variables record.
 */

const PROMPTS_DIR = path.join(process.cwd(), "prompts");

/**
 * Load a prompt template from /prompts, inject variables, return the final string.
 *
 * @param promptFile - Filename under /prompts (e.g. "hint.md", "persona_runtime.md")
 * @param variables - Key-value pairs to inject into {{PLACEHOLDER}} tokens
 * @returns The fully-rendered prompt string
 * @throws If the file doesn't exist or can't be read
 */
export async function buildPrompt(
  promptFile: string,
  variables: Record<string, string> = {}
): Promise<string> {
  const filePath = path.join(PROMPTS_DIR, promptFile);

  let template: string;
  try {
    template = await readFile(filePath, "utf-8");
  } catch (err) {
    throw new Error(
      `[promptBuilder] Failed to read prompt file "${promptFile}" at ${filePath}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Replace all {{VARIABLE}} placeholders with their values
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    // Replace all occurrences of {{KEY}} (case-sensitive)
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(value);
  }

  return result;
}
