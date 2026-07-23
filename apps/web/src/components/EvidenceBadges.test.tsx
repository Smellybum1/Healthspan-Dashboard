import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidenceMaturityBadge, ConfidenceBadge } from '@healthspan/ui';

describe('evidence label display', () => {
  it('renders maturity and confidence badges', () => {
    render(
      <>
        <EvidenceMaturityBadge maturity="controlled_clinical_trial" />
        <ConfidenceBadge score={0.82} />
      </>,
    );
    expect(screen.getByText(/Controlled clinical trial/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidence: high/i)).toBeInTheDocument();
  });
});
