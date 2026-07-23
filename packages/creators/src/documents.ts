export const DOCUMENT_PIPELINE_VERSION = 'm5.documents.1';

export type ImportedDocumentKind = 'vtt' | 'srt' | 'txt' | 'json' | 'notes';

export type RightsBasis =
  | 'user_owned'
  | 'authorised_caption_export'
  | 'public_domain_or_licence'
  | 'fair_dealing_research_notes'
  | 'other_declared';

export type DocumentSegmentDraft = {
  segmentKind: 'cue' | 'paragraph' | 'json_cue' | 'full_text';
  text: string;
  charStart: number;
  charEnd: number;
  sourceLineOrCueIds?: string;
};

export type ParsedDocument = {
  kind: ImportedDocumentKind;
  text: string;
  cueCount: number;
  warnings: string[];
  segments: DocumentSegmentDraft[];
};

const MAX_BYTES = 2 * 1024 * 1024;

export function detectDocumentKind(filename: string, mediaType?: string): ImportedDocumentKind | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.vtt') || mediaType?.includes('vtt')) return 'vtt';
  if (lower.endsWith('.srt')) return 'srt';
  if (lower.endsWith('.json') || mediaType?.includes('json')) return 'json';
  if (lower.endsWith('.txt') || lower.endsWith('.md')) return 'txt';
  return null;
}

export function validateDocumentBytes(bytes: Buffer): void {
  if (bytes.length === 0) throw new Error('Empty document');
  if (bytes.length > MAX_BYTES) throw new Error(`Document exceeds ${MAX_BYTES} byte cap`);
}

function segmentsFromLines(lines: string[], kind: DocumentSegmentDraft['segmentKind']): {
  text: string;
  segments: DocumentSegmentDraft[];
} {
  const segments: DocumentSegmentDraft[] = [];
  let offset = 0;
  const parts: string[] = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (parts.length) offset += 1; // newline joiner
    const charStart = offset;
    const charEnd = charStart + trimmed.length;
    segments.push({
      segmentKind: kind,
      text: trimmed,
      charStart,
      charEnd,
      sourceLineOrCueIds: String(idx + 1),
    });
    parts.push(trimmed);
    offset = charEnd;
  });
  return { text: parts.join('\n'), segments };
}

/** Strip VTT/SRT timing lines; retain cue text with character offsets for claim spans. */
export function parseTranscriptDocument(opts: {
  filename: string;
  bytes: Buffer;
  mediaType?: string;
}): ParsedDocument {
  validateDocumentBytes(opts.bytes);
  const kind = detectDocumentKind(opts.filename, opts.mediaType);
  if (!kind) throw new Error('Unsupported document type (allowed: vtt, srt, txt, json)');
  const raw = opts.bytes.toString('utf8');
  const warnings: string[] = [];

  if (kind === 'json') {
    try {
      const parsed = JSON.parse(raw) as {
        text?: string;
        transcript?: string;
        cues?: Array<{ text?: string }>;
      };
      if (parsed.cues?.length) {
        const cueTexts = parsed.cues.map((c) => (c.text ?? '').trim()).filter(Boolean);
        const built = segmentsFromLines(cueTexts, 'json_cue');
        if (!built.text) throw new Error('JSON document missing text/transcript/cues');
        return {
          kind,
          text: built.text,
          cueCount: cueTexts.length,
          warnings,
          segments: built.segments,
        };
      }
      const text = (parsed.text ?? parsed.transcript ?? '').trim();
      if (!text) throw new Error('JSON document missing text/transcript/cues');
      return {
        kind,
        text,
        cueCount: 1,
        warnings,
        segments: [{ segmentKind: 'full_text', text, charStart: 0, charEnd: text.length }],
      };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Invalid JSON transcript');
    }
  }

  if (kind === 'vtt' || kind === 'srt') {
    const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/);
    const cues: string[] = [];
    let buf: string[] = [];
    const isTiming = (line: string) =>
      /\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}/.test(line) || /^\d+$/.test(line.trim());
    for (const line of lines) {
      if (line.startsWith('WEBVTT') || line.startsWith('NOTE')) continue;
      if (!line.trim()) {
        if (buf.length) {
          cues.push(buf.join(' ').trim());
          buf = [];
        }
        continue;
      }
      if (isTiming(line)) continue;
      buf.push(line.replace(/<[^>]+>/g, '').trim());
    }
    if (buf.length) cues.push(buf.join(' ').trim());
    if (cues.length === 0) warnings.push('No cue text extracted');
    const built = segmentsFromLines(cues, 'cue');
    return { kind, text: built.text, cueCount: cues.length, warnings, segments: built.segments };
  }

  const text = raw.trim();
  const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const built = segmentsFromLines(paragraphs.length ? paragraphs : [text], 'paragraph');
  return { kind: 'txt', text: built.text, cueCount: built.segments.length, warnings, segments: built.segments };
}

export const DOCUMENT_PROHIBITIONS = [
  'unofficial_caption_scrape',
  'media_download',
  'speech_to_text',
  'youtube_api_metadata_as_claim_evidence',
] as const;
