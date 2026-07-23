import { describe, expect, it } from 'vitest';
import { parseYoutubeChannelRef } from './creator-service.js';

describe('creator channel parsing', () => {
  it('accepts channel IDs and handles', () => {
    expect(parseYoutubeChannelRef('UC1234567890123456789012').externalAccountId).toBe(
      'UC1234567890123456789012',
    );
    expect(parseYoutubeChannelRef('@ExampleChannel').handle).toBe('@ExampleChannel');
  });
});
