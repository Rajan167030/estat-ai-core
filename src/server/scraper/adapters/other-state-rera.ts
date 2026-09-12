import { StubReraAdapter } from "./stub-rera";
import { generateSyntheticProjects } from "../synthetic";

const pad = (n: number, len: number) => String(n).padStart(len, "0");

export const upReraAdapter = new StubReraAdapter({
  source: "up-rera",
  label: "UP RERA",
  homepageUrl: "https://up-rera.in",
  fixture: generateSyntheticProjects({
    source: "up-rera",
    districts: [
      "Noida",
      "Ghaziabad",
      "Lucknow",
      "Greater Noida",
      "Kanpur",
      "Varanasi",
      "Meerut",
      "Prayagraj",
    ],
    count: 350,
    reraNumber: (_rnd, i) => `UPRERAPRJ${pad(10000 + i, 5)}`,
  }),
});

export const karnatakaReraAdapter = new StubReraAdapter({
  source: "karnataka-rera",
  label: "Karnataka RERA (K-RERA)",
  homepageUrl: "https://rera.karnataka.gov.in",
  fixture: generateSyntheticProjects({
    source: "karnataka-rera",
    districts: ["Bengaluru Urban", "Mysuru", "Mangaluru", "Belagavi", "Hubballi-Dharwad"],
    count: 250,
    reraNumber: (rnd, i) =>
      `PRM/KA/RERA/1251/${pad(Math.floor(rnd() * 900) + 100, 3)}/PR/${pad((i % 28) + 1, 2)}${pad((i % 12) + 1, 2)}${pad(20 + (i % 6), 2)}/${pad(i, 6)}`,
  }),
});

export const telanganaReraAdapter = new StubReraAdapter({
  source: "telangana-rera",
  label: "Telangana RERA (TS-RERA)",
  homepageUrl: "https://rera.telangana.gov.in",
  fixture: generateSyntheticProjects({
    source: "telangana-rera",
    districts: ["Ranga Reddy", "Hyderabad", "Medchal-Malkajgiri", "Sangareddy"],
    count: 200,
    reraNumber: (_rnd, i) => `P0${pad(2400 + i, 8)}`,
  }),
});

export const gujaratReraAdapter = new StubReraAdapter({
  source: "gujarat-rera",
  label: "Gujarat RERA (GujRERA)",
  homepageUrl: "https://gujrera.gujarat.gov.in",
  fixture: generateSyntheticProjects({
    source: "gujarat-rera",
    districts: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
    count: 220,
    reraNumber: (rnd, i, district) =>
      `PR/GJ/${district.toUpperCase()}/${district.toUpperCase()} CITY/AUDA/CAA${pad(i, 5)}/${pad((i % 28) + 1, 2)}${pad((i % 12) + 1, 2)}${pad(20 + (i % 6), 2)}`,
  }),
});

export const tamilNaduReraAdapter = new StubReraAdapter({
  source: "tn-rera",
  label: "Tamil Nadu RERA (TNRERA)",
  homepageUrl: "https://rera.tn.gov.in",
  fixture: generateSyntheticProjects({
    source: "tn-rera",
    districts: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
    count: 180,
    reraNumber: (rnd, i) => `TN/29/Building/${pad(i, 4)}/${2020 + Math.floor(i / 60)}`,
  }),
});
