/**
 * TRAI's Telecom Commercial Communications Customer Preference Regulations
 * restrict commercial calls to 9:00–21:00 IST, and NDNC-registered numbers
 * must not receive promotional calls at all (transactional calls are a
 * separate, narrower exemption). This module encodes both gates; every call
 * must pass through `evaluateCompliance` before dialing, and the result is
 * recorded on the CallResult even when it blocks the call.
 */

export interface DndCheckResult {
  allowed: boolean;
  registryStatus: "NDNC_FULL_BLOCK" | "NDNC_PARTIAL" | "NOT_REGISTERED" | "UNKNOWN";
}

export interface DndProvider {
  check(phoneE164: string): Promise<DndCheckResult>;
}

/**
 * Real NDNC scrubbing has to go through your telecom operator / a
 * DLT-registered vendor (there's no public self-serve API) — this stub
 * always allows so the rest of the workflow is testable, and it's the one
 * place to plug in a real provider once you have that vendor contract.
 */
export class StubDndProvider implements DndProvider {
  async check(_phoneE164: string): Promise<DndCheckResult> {
    return { allowed: true, registryStatus: "UNKNOWN" };
  }
}

const IST_OFFSET_MIN = 5.5 * 60;

export function isWithinCallingHours(date: Date, startHour = 9, endHour = 21): boolean {
  const istMinutes = (Math.floor(date.getTime() / 60000) + IST_OFFSET_MIN) % (24 * 60);
  const istHour = Math.floor(istMinutes / 60);
  return istHour >= startHour && istHour < endHour;
}

export interface ComplianceResult {
  allowed: boolean;
  reasons: string[];
}

export async function evaluateCompliance(
  phoneE164: string,
  dnd: DndProvider,
  now: Date = new Date(),
): Promise<ComplianceResult> {
  const reasons: string[] = [];

  if (!isWithinCallingHours(now)) {
    reasons.push("Outside TRAI-permitted calling window (09:00–21:00 IST)");
  }

  const dndResult = await dnd.check(phoneE164);
  if (!dndResult.allowed) {
    reasons.push(`Number is NDNC-registered (${dndResult.registryStatus})`);
  }

  return { allowed: reasons.length === 0, reasons };
}
