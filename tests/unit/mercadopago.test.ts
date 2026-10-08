import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "@/lib/mercadopago";

describe("verifyWebhookSignature", () => {
  const secret = "s3cr3t";
  const sign = (manifest: string) => createHmac("sha256", secret).update(manifest).digest("hex");

  it("acepta una firma válida", () => {
    const ts = "1700000000";
    const v1 = sign(`id:123456;request-id:req-1;ts:${ts};`);
    expect(
      verifyWebhookSignature({ xSignature: `ts=${ts},v1=${v1}`, xRequestId: "req-1", dataId: "123456", secret }),
    ).toBe(true);
  });

  it("rechaza firma alterada, faltante o con otro id", () => {
    const ts = "1700000000";
    const v1 = sign(`id:123456;request-id:req-1;ts:${ts};`);
    expect(verifyWebhookSignature({ xSignature: `ts=${ts},v1=${v1}`, xRequestId: "req-1", dataId: "999", secret })).toBe(false);
    expect(verifyWebhookSignature({ xSignature: `ts=${ts},v1=deadbeef`, xRequestId: "req-1", dataId: "123456", secret })).toBe(false);
    expect(verifyWebhookSignature({ xSignature: null, xRequestId: "req-1", dataId: "123456", secret })).toBe(false);
  });
});
