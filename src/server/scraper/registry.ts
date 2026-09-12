import type { RERAAdapter } from "./adapters/base";
import { MahaReraAdapter } from "./adapters/maharera";
import {
  upReraAdapter,
  karnatakaReraAdapter,
  telanganaReraAdapter,
  gujaratReraAdapter,
  tamilNaduReraAdapter,
} from "./adapters/other-state-rera";

export interface ReraSourceMeta {
  key: string;
  label: string;
  homepageUrl: string;
}

const adapters: RERAAdapter[] = [
  new MahaReraAdapter(),
  upReraAdapter,
  karnatakaReraAdapter,
  telanganaReraAdapter,
  gujaratReraAdapter,
  tamilNaduReraAdapter,
];

export const RERA_ADAPTERS: Record<string, RERAAdapter> = Object.fromEntries(
  adapters.map((a) => [a.source, a]),
);

export const RERA_SOURCES: ReraSourceMeta[] = [
  {
    key: "maharera",
    label: "MahaRERA (Maharashtra)",
    homepageUrl: "https://maharera.mahaonline.gov.in",
  },
  { key: "up-rera", label: "UP RERA", homepageUrl: "https://up-rera.in" },
  {
    key: "karnataka-rera",
    label: "Karnataka RERA (K-RERA)",
    homepageUrl: "https://rera.karnataka.gov.in",
  },
  {
    key: "telangana-rera",
    label: "Telangana RERA (TS-RERA)",
    homepageUrl: "https://rera.telangana.gov.in",
  },
  {
    key: "gujarat-rera",
    label: "Gujarat RERA (GujRERA)",
    homepageUrl: "https://gujrera.gujarat.gov.in",
  },
  { key: "tn-rera", label: "Tamil Nadu RERA (TNRERA)", homepageUrl: "https://rera.tn.gov.in" },
];
