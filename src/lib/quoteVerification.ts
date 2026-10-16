import { TranscriptEntry, VerificationResult } from "@/types";
export type { VerificationResult };



/**
 * Parses the raw AI segment report for [QUOTE] blocks, looks up the referenced
 * message IDs in the real transcript, and substitutes them with exact quotes.
 * If an ID doesn't exist (hallucination), the block is silently dropped.
 */
export function verifyQuotesAndCalculateScore(
  rawMarkdown: string,
  transcript: TranscriptEntry[]
): VerificationResult {
  let mistakesCount = 0;
  let praiseCount = 0;

  // Regex to match the entire [QUOTE]...[/QUOTE] block, including the content inside.
  // We use ^[ \t]* with the 'm' flag to consume any leading spaces so the resulting
  // blockquote isn't accidentally parsed as an indented code block by Markdown.
  const quoteRegex = /^[ \t]*\[QUOTE\s+type="([^"]+)"\s+coach_msg="([^"]+)"(?:\s+client_msg="([^"]*)")?\]([\s\S]*?)\[\/QUOTE\]/gm;

  const verifiedMarkdown = rawMarkdown.replace(
    quoteRegex,
    (match, type, coachMsgId, clientMsgId, innerContent) => {
      const coachMsg = transcript.find((m) => m.id === coachMsgId);
      const clientMsg = clientMsgId ? transcript.find((m) => m.id === clientMsgId) : null;

      // If the coach message doesn't exist, this is a hallucinated mistake. Drop it.
      if (!coachMsg) {
        console.warn(`[QuoteVerification] Dropped hallucinated coach_msg ID: ${coachMsgId}`);
        return "";
      }

      const formatQuote = (speaker: string, text: string) => {
        const lines = text.trim().split('\n');
        if (lines.length === 1) {
          return `> **${speaker}:** "${lines[0]}"\n`;
        }
        const formattedText = lines.map((line, i) => {
          if (i === 0) return `"${line}`;
          if (i === lines.length - 1) return `> ${line}"`;
          return `> ${line}`;
        }).join('\n');
        return `> **${speaker}:** ${formattedText}\n>\n`;
      };

      let block = "";

      if (type === "mistake") {
        mistakesCount++;
        block += `> 🚨 **Area for Improvement**\n>\n`;
      } else if (type === "praise") {
        praiseCount++;
        block += `> 🌟 **Excellent Coaching Moment**\n>\n`;
      } else {
        // Unknown type, just generic
        block += `> 📝 **Note**\n>\n`;
      }
      
      if (clientMsg) {
        block += formatQuote("Client", clientMsg.text);
      }
      
      block += formatQuote("Coach", coachMsg.text);
      
      // Prefix each line of the inner content with ">" to keep it in the blockquote.
      const formattedInner = innerContent
        .trim()
        .split('\n')
        .map((line: string) => `> ${line.trim()}`)
        .join('\n');

      block += formattedInner;

      return block + '\n\n';
    }
  );

  return { verifiedMarkdown, mistakesCount, praiseCount };
}
