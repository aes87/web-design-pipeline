// Patent families — single source of truth.
//
// Each family is one disclosure that may have multiple grants and/or pending
// applications. The page renders ONE row per family. The headline number is
// the most recent grant; a count summary in the caption shows total grants,
// total pending, and the year range across the family.
//
// Member shape: { number, kind, status: "granted" | "published", year }
// All entries below have been verified by reading the inventor list off the
// patent's own first page.
const FAMILIES = [
  {
    id: "smart-bulb",
    title: "Phase-control + digital-communication smart bulbs",
    brief: "Smart bulbs that detect whether they're paired with a phase-control or digital-message dimmer and switch control modes accordingly — including mixed circuits with both smart and non-smart bulbs on the same wire.",
    members: [
      { number: "12490358", kind: "B2", status: "granted", year: 2025 },
      { number: "20260052611", kind: "A1", status: "published", year: 2026 },
    ],
  },
  {
    id: "capacitive-touch",
    title: "Capacitive touch surface dimmer",
    brief: "Dimmer with mechanical buttons and a parallel capacitive touch bar for intensity selection. Blanking periods disambiguate press from touch and let the user pre-select an intensity before turn-on.",
    members: [
      { number: "12438543", kind: "B2", status: "granted", year: 2025 },
      { number: "11569818", kind: "B2", status: "granted", year: 2023 },
      { number: "20260031813", kind: "A1", status: "published", year: 2026 },
    ],
  },
  {
    id: "high-efficiency-loads",
    title: "Two-wire dimmers for high-efficiency loads",
    brief: "Foundational topology family for Lutron's LED+ product line — two-wire dimmers that drive flicker-free LED and CFL loads. A thyristor plus an auxiliary current path keeps the load powered when the main switch is off, with constant gate-drive coupling that draws under a microamp average.",
    members: [
      { number: "12369234", kind: "B2", status: "granted", year: 2025 },
      { number: "12369233", kind: "B2", status: "granted", year: 2025 },
      { number: "11991796", kind: "B2", status: "granted", year: 2024 },
      { number: "11870334", kind: "B2", status: "granted", year: 2024 },
      { number: "11638334", kind: "B2", status: "granted", year: 2023 },
      { number: "10958187", kind: "B2", status: "granted", year: 2021 },
      { number: "10958186", kind: "B2", status: "granted", year: 2021 },
      { number: "10530268", kind: "B2", status: "granted", year: 2020 },
      { number: "10447171", kind: "B2", status: "granted", year: 2019 },
      { number: "10158300", kind: "B2", status: "granted", year: 2018 },
      { number: "10128772", kind: "B2", status: "granted", year: 2018 },
      { number: "9941811",  kind: "B2", status: "granted", year: 2018 },
      { number: "9853561",  kind: "B2", status: "granted", year: 2017 },
      { number: "9356531",  kind: "B2", status: "granted", year: 2016 },
      { number: "9343998",  kind: "B2", status: "granted", year: 2016 },
      { number: "9343997",  kind: "B2", status: "granted", year: 2016 },
      { number: "8988058",  kind: "B2", status: "granted", year: 2015 },
      { number: "8957662",  kind: "B2", status: "granted", year: 2015 },
      { number: "20230232510", kind: "A1", status: "published", year: 2023 },
      { number: "20210211063", kind: "A1", status: "published", year: 2021 },
    ],
  },
  {
    id: "battery-powered-remote",
    title: "Battery-powered Pico and Aurora remotes",
    brief: "Power-management, RF, and sensing architecture for Lutron's battery-powered remote line — including the Pico flat-button remote and the Aurora knob retrofit. Dual magnetic sensors on a magnetic ring with motion-driven wake keep the device alive on a coin cell for years; persistent-actuation detection extends the input vocabulary.",
    members: [
      { number: "12354468", kind: "B2", status: "granted", year: 2025 },
      { number: "11816979", kind: "B2", status: "granted", year: 2023 },
      { number: "11335185", kind: "B2", status: "granted", year: 2022 },
      { number: "10856396", kind: "B2", status: "granted", year: 2020 },
      { number: "10219359", kind: "B2", status: "granted", year: 2019 },
      { number: "20240029551", kind: "A1", status: "published", year: 2024 },
    ],
  },
  {
    id: "controllable-lighting",
    title: "Color-tunable LED lighting",
    brief: "Multi-emitter LED lamp with three or more emitters along the black-body locus; activates only two adjacent emitters at a time to tune color temperature continuously from ~1800 K to ~5700 K.",
    members: [
      { number: "12317384", kind: "B2", status: "granted", year: 2025 },
      { number: "11991800", kind: "B2", status: "granted", year: 2024 },
      { number: "11612029", kind: "B2", status: "granted", year: 2023 },
      { number: "20250254768", kind: "A1", status: "published", year: 2025 },
      { number: "20240284567", kind: "A1", status: "published", year: 2024 },
      { number: "20230209673", kind: "A1", status: "published", year: 2023 },
    ],
  },
  {
    id: "gesture",
    title: "Gesture-based control device",
    brief: "Wall-mounted dimmer with a touch-and-gesture surface that translates swipe and tap input into intensity, color, and zone selection on a single keypad.",
    members: [
      { number: "12283445", kind: "B2", status: "granted", year: 2025 },
      { number: "11804339", kind: "B2", status: "granted", year: 2023 },
      { number: "11538643", kind: "B2", status: "granted", year: 2022 },
      { number: "11232916", kind: "B2", status: "granted", year: 2022 },
      { number: "10672261", kind: "B2", status: "granted", year: 2020 },
      { number: "10475333", kind: "B2", status: "granted", year: 2019 },
      { number: "10446019", kind: "B2", status: "granted", year: 2019 },
      { number: "10109181", kind: "B2", status: "granted", year: 2018 },
      { number: "10102742", kind: "B2", status: "granted", year: 2018 },
    ],
  },
  {
    id: "orientation",
    title: "Orientation-detecting remote",
    brief: "Handheld remote that senses how the user is holding it and remaps button behavior and LED feedback accordingly. Switches, optical, magnetic, and accelerometer cues feed the orientation logic.",
    members: [
      { number: "12278076", kind: "B2", status: "granted", year: 2025 },
      { number: "11830696", kind: "B2", status: "granted", year: 2023 },
      { number: "11646166", kind: "B2", status: "granted", year: 2023 },
      { number: "11264184", kind: "B2", status: "granted", year: 2022 },
      { number: "10977931", kind: "B2", status: "granted", year: 2021 },
      { number: "10685560", kind: "B2", status: "granted", year: 2020 },
      { number: "10134268", kind: "B2", status: "granted", year: 2018 },
      { number: "20200279477", kind: "A1", status: "published", year: 2020 },
    ],
  },
  {
    id: "ui",
    title: "User interface for a battery-powered control device",
    brief: "UI architecture for a battery-powered keypad/remote — light-bar and indicator LEDs that surface intensity and low-battery feedback in normal and degraded modes.",
    members: [
      { number: "12096528", kind: "B2", status: "granted", year: 2024 },
      { number: "11765800", kind: "B2", status: "granted", year: 2023 },
      { number: "11234300", kind: "B2", status: "granted", year: 2022 },
      { number: "10524333", kind: "B2", status: "granted", year: 2019 },
    ],
  },
  {
    id: "controllable-load",
    title: "Controllable-load circuit for legacy two-wire dimmers",
    brief: "Auxiliary load circuit that draws just enough current to keep a phase-control dimmer's thyristor latched, automatically distinguishing forward from reverse phase control. Lets modern LED loads work cleanly with legacy two-wire dimmers.",
    members: [
      { number: "12016096", kind: "B2", status: "granted", year: 2024 },
      { number: "11743983", kind: "B2", status: "granted", year: 2023 },
      { number: "10674583", kind: "B2", status: "granted", year: 2020 },
      { number: "9578700",  kind: "B2", status: "granted", year: 2017 },
      { number: "9220133",  kind: "B2", status: "granted", year: 2015 },
    ],
  },
  {
    id: "audio",
    title: "Audio-based load control system",
    brief: "Voice and audio-cue driven control for lighting and other electrical loads. Distributed wall-mounted microphone array with on-device wake-word selection across multiple voice assistants.",
    members: [
      { number: "11797268", kind: "B2", status: "granted", year: 2023 },
      { number: "11216246", kind: "B2", status: "granted", year: 2022 },
      { number: "10694608", kind: "B2", status: "granted", year: 2020 },
      { number: "20220113936", kind: "A1", status: "published", year: 2022 },
    ],
  },
  {
    id: "smart-mounting",
    title: "Smart-mounting system for a remote control device",
    brief: "Mounting hardware that pairs a battery-powered remote with its wall or surface bracket — magnetic retention, position sensing, and a path for power or data when the remote is docked.",
    members: [
      { number: "20240047157", kind: "A1", status: "published", year: 2024 },
    ],
  },
  {
    id: "analog-adjustment",
    title: "Analog-adjustment actuator dimmer",
    brief: "Dimmer with an analog adjustment actuator — a continuous physical control whose position drives the load level, with circuitry that translates actuator state into the underlying digital control loop.",
    members: [
      { number: "20230036482", kind: "A1", status: "published", year: 2023 },
    ],
  },
];

const PREFIX = "US";

// ── Display helpers ──────────────────────────────────────────────────
function formatNumber(n, status) {
  if (status === "published") return `${n.slice(0, 4)}/${n.slice(4)}`;
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function patentUrl(member) {
  return `https://patents.google.com/patent/${PREFIX}${member.number}${member.kind || ""}/en`;
}

function leadMember(family) {
  const grants = family.members.filter((m) => m.status === "granted");
  const pool = grants.length ? grants : family.members;
  return pool.slice().sort((a, b) => Number(b.number) - Number(a.number))[0];
}

function familyYearRange(family) {
  const years = family.members.map((m) => m.year).filter(Boolean);
  if (!years.length) return "";
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}

function familyCounts(family) {
  return {
    grants: family.members.filter((m) => m.status === "granted").length,
    pending: family.members.filter((m) => m.status === "published").length,
  };
}

function familyCaption(family) {
  const { grants, pending } = familyCounts(family);
  const range = familyYearRange(family);
  const parts = [];
  if (grants) parts.push(`${grants} ${grants === 1 ? "grant" : "grants"}`);
  if (pending) parts.push(`${pending} pending`);
  if (range) parts.push(range);
  return parts.join(" · ");
}

// ── Render ───────────────────────────────────────────────────────────
function renderFamily(listEl, family) {
  const tpl = document.getElementById("patent-row-template");
  if (!tpl) return;
  const node = tpl.content.firstElementChild.cloneNode(true);

  const link = node.querySelector(".patent__link");
  const numEl = node.querySelector(".patent__number");
  const titleEl = node.querySelector(".patent__title");
  const briefEl = node.querySelector(".patent__brief");
  const bodyEl = node.querySelector(".patent__body");

  const lead = leadMember(family);

  link.href = patentUrl(lead);
  link.setAttribute(
    "aria-label",
    `${family.title} — opens ${PREFIX} ${formatNumber(lead.number, lead.status)} on Google Patents`
  );

  numEl.innerHTML = `<span class="pn-prefix">${PREFIX}</span>${formatNumber(lead.number, lead.status)}`;
  titleEl.textContent = family.title;
  briefEl.textContent = family.brief;

  const caption = document.createElement("div");
  caption.className = "patent__family";
  const countSpan = document.createElement("span");
  countSpan.className = "patent__family-count";
  countSpan.textContent = familyCaption(family);
  caption.appendChild(countSpan);
  bodyEl.appendChild(caption);

  listEl.appendChild(node);
}

function renderSummary(grants, pending, families) {
  const grantedEl = document.querySelector('[data-summary="granted"]');
  const publishedEl = document.querySelector('[data-summary="published"]');
  const familiesEl = document.querySelector('[data-summary="families"]');
  if (grantedEl) grantedEl.textContent = String(grants).padStart(2, "0");
  if (publishedEl) publishedEl.textContent = String(pending).padStart(2, "0");
  if (familiesEl) familiesEl.textContent = String(families).padStart(2, "0");
}

function isGrantedFamily(family) {
  return family.members.some((m) => m.status === "granted");
}

function init() {
  const grantedList = document.querySelector('[data-list="granted"]');
  const publishedList = document.querySelector('[data-list="published"]');
  const publishedGroup = document.querySelector('[data-group="published"]');

  const granted = FAMILIES.filter(isGrantedFamily);
  const pending = FAMILIES.filter((f) => !isGrantedFamily(f));

  granted.forEach((f) => renderFamily(grantedList, f));
  pending.forEach((f) => renderFamily(publishedList, f));

  if (publishedGroup) publishedGroup.hidden = pending.length === 0;

  const totalGrants = FAMILIES.reduce(
    (n, f) => n + f.members.filter((m) => m.status === "granted").length,
    0
  );
  const totalPending = FAMILIES.reduce(
    (n, f) => n + f.members.filter((m) => m.status === "published").length,
    0
  );
  renderSummary(totalGrants, totalPending, FAMILIES.length);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
