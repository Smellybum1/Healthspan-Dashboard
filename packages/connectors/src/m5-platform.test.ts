import {
  createYoutubeConnector,
  createXConnector,
  projectDrugsAtFdaZip,
  buildSimpleZip,
} from '@healthspan/connectors';
import { describe, expect, it } from 'vitest';

describe('M4 hardening + M5 platform connectors', () => {
  it('unchanged Drugs@FDA ZIP projection is idempotent by fingerprint', () => {
    const zip = buildSimpleZip({
      'Products.txt':
        'ApplNo\tProductNo\tForm\tStrength\tDrugName\tActiveIngredient\tMarketingStatus\n020357\t001\tTABLET\t500MG\tGLUCOPHAGE\tMETFORMIN HYDROCHLORIDE\tPrescription\n',
    });
    const a = projectDrugsAtFdaZip(zip);
    const b = projectDrugsAtFdaZip(zip);
    expect(a.releaseFingerprint).toBe(b.releaseFingerprint);
    expect(a.products).toHaveLength(1);
  });

  it('changed Drugs@FDA ZIP changes fingerprint (later product status change)', () => {
    const a = projectDrugsAtFdaZip(
      buildSimpleZip({
        'Products.txt':
          'ApplNo\tProductNo\tForm\tStrength\tDrugName\tActiveIngredient\tMarketingStatus\n020357\t001\tTABLET\t500MG\tGLUCOPHAGE\tMETFORMIN HYDROCHLORIDE\tPrescription\n',
      }),
    );
    const b = projectDrugsAtFdaZip(
      buildSimpleZip({
        'Products.txt':
          'ApplNo\tProductNo\tForm\tStrength\tDrugName\tActiveIngredient\tMarketingStatus\n020357\t001\tTABLET\t500MG\tGLUCOPHAGE\tMETFORMIN HYDROCHLORIDE\tDiscontinued\n',
      }),
    );
    expect(a.releaseFingerprint).not.toBe(b.releaseFingerprint);
    expect(a.products[0]?.marketingStatus).toBe('Prescription');
    expect(b.products[0]?.marketingStatus).toBe('Discontinued');
  });

  it('first baseline discovery surfaces historical regulator product rows', () => {
    const projected = projectDrugsAtFdaZip(
      buildSimpleZip({
        'Products.txt':
          'ApplNo\tProductNo\tForm\tStrength\tDrugName\tActiveIngredient\tMarketingStatus\n020357\t001\tTABLET\t500MG\tGLUCOPHAGE\tMETFORMIN HYDROCHLORIDE\tPrescription\n020702\t001\tTABLET\t10MG\tGLUCOPHAGE XR\tMETFORMIN HYDROCHLORIDE\tPrescription\n',
      }),
    );
    expect(projected.products.length).toBe(2);
    expect(projected.releaseFingerprint.length).toBe(64);
  });

  it('YouTube connector is healthy when disabled and never claims evidence', async () => {
    const result = await createYoutubeConnector({ apiKey: null, channelIds: [] }).fetchWindow({
      cursor: {},
      lookbackDays: 7,
      recordCap: 5,
    });
    expect(result.ok).toBe(true);
    expect(result.warnings?.[0]).toMatch(/never claim evidence/i);
  });

  it('X connector stays disabled by default without budget acknowledgement', async () => {
    const result = await createXConnector({}).fetchWindow({
      cursor: {},
      lookbackDays: 7,
      recordCap: 5,
    });
    expect(result.ok).toBe(true);
    expect(result.pages).toHaveLength(0);
    expect(result.warnings?.[0]).toMatch(/disabled by default/i);
  });

  it('rejects X auto-recharge as unsupported', () => {
    expect(process.env.HEALTHSPAN_X_AUTO_RECHARGE_ALLOWED === 'true').toBe(false);
  });
});
