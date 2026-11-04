/**
 * Bangladesh's 64 districts, grouped by division. Slugs match the API
 * (internal/domain/profile.go); the division is derived from the district server-side.
 */
export const DIVISIONS = ["dhaka", "chattogram", "rajshahi", "khulna", "barishal", "sylhet", "rangpur", "mymensingh"] as const;
export type Division = (typeof DIVISIONS)[number];

type District = { slug: string; en: string; bn: string };

export const DISTRICTS_BY_DIVISION: Record<Division, District[]> = {
  dhaka: [
    { slug: "dhaka", en: "Dhaka", bn: "ঢাকা" },
    { slug: "faridpur", en: "Faridpur", bn: "ফরিদপুর" },
    { slug: "gazipur", en: "Gazipur", bn: "গাজীপুর" },
    { slug: "gopalganj", en: "Gopalganj", bn: "গোপালগঞ্জ" },
    { slug: "kishoreganj", en: "Kishoreganj", bn: "কিশোরগঞ্জ" },
    { slug: "madaripur", en: "Madaripur", bn: "মাদারীপুর" },
    { slug: "manikganj", en: "Manikganj", bn: "মানিকগঞ্জ" },
    { slug: "munshiganj", en: "Munshiganj", bn: "মুন্সিগঞ্জ" },
    { slug: "narayanganj", en: "Narayanganj", bn: "নারায়ণগঞ্জ" },
    { slug: "narsingdi", en: "Narsingdi", bn: "নরসিংদী" },
    { slug: "rajbari", en: "Rajbari", bn: "রাজবাড়ী" },
    { slug: "shariatpur", en: "Shariatpur", bn: "শরীয়তপুর" },
    { slug: "tangail", en: "Tangail", bn: "টাঙ্গাইল" },
  ],
  chattogram: [
    { slug: "bandarban", en: "Bandarban", bn: "বান্দরবান" },
    { slug: "brahmanbaria", en: "Brahmanbaria", bn: "ব্রাহ্মণবাড়িয়া" },
    { slug: "chandpur", en: "Chandpur", bn: "চাঁদপুর" },
    { slug: "chattogram", en: "Chattogram", bn: "চট্টগ্রাম" },
    { slug: "coxsbazar", en: "Cox's Bazar", bn: "কক্সবাজার" },
    { slug: "cumilla", en: "Cumilla", bn: "কুমিল্লা" },
    { slug: "feni", en: "Feni", bn: "ফেনী" },
    { slug: "khagrachhari", en: "Khagrachhari", bn: "খাগড়াছড়ি" },
    { slug: "lakshmipur", en: "Lakshmipur", bn: "লক্ষ্মীপুর" },
    { slug: "noakhali", en: "Noakhali", bn: "নোয়াখালী" },
    { slug: "rangamati", en: "Rangamati", bn: "রাঙ্গামাটি" },
  ],
  rajshahi: [
    { slug: "bogura", en: "Bogura", bn: "বগুড়া" },
    { slug: "chapainawabganj", en: "Chapainawabganj", bn: "চাঁপাইনবাবগঞ্জ" },
    { slug: "joypurhat", en: "Joypurhat", bn: "জয়পুরহাট" },
    { slug: "naogaon", en: "Naogaon", bn: "নওগাঁ" },
    { slug: "natore", en: "Natore", bn: "নাটোর" },
    { slug: "pabna", en: "Pabna", bn: "পাবনা" },
    { slug: "rajshahi", en: "Rajshahi", bn: "রাজশাহী" },
    { slug: "sirajganj", en: "Sirajganj", bn: "সিরাজগঞ্জ" },
  ],
  khulna: [
    { slug: "bagerhat", en: "Bagerhat", bn: "বাগেরহাট" },
    { slug: "chuadanga", en: "Chuadanga", bn: "চুয়াডাঙ্গা" },
    { slug: "jashore", en: "Jashore", bn: "যশোর" },
    { slug: "jhenaidah", en: "Jhenaidah", bn: "ঝিনাইদহ" },
    { slug: "khulna", en: "Khulna", bn: "খুলনা" },
    { slug: "kushtia", en: "Kushtia", bn: "কুষ্টিয়া" },
    { slug: "magura", en: "Magura", bn: "মাগুরা" },
    { slug: "meherpur", en: "Meherpur", bn: "মেহেরপুর" },
    { slug: "narail", en: "Narail", bn: "নড়াইল" },
    { slug: "satkhira", en: "Satkhira", bn: "সাতক্ষীরা" },
  ],
  barishal: [
    { slug: "barguna", en: "Barguna", bn: "বরগুনা" },
    { slug: "barishal", en: "Barishal", bn: "বরিশাল" },
    { slug: "bhola", en: "Bhola", bn: "ভোলা" },
    { slug: "jhalokathi", en: "Jhalokathi", bn: "ঝালকাঠি" },
    { slug: "patuakhali", en: "Patuakhali", bn: "পটুয়াখালী" },
    { slug: "pirojpur", en: "Pirojpur", bn: "পিরোজপুর" },
  ],
  sylhet: [
    { slug: "habiganj", en: "Habiganj", bn: "হবিগঞ্জ" },
    { slug: "moulvibazar", en: "Moulvibazar", bn: "মৌলভীবাজার" },
    { slug: "sunamganj", en: "Sunamganj", bn: "সুনামগঞ্জ" },
    { slug: "sylhet", en: "Sylhet", bn: "সিলেট" },
  ],
  rangpur: [
    { slug: "dinajpur", en: "Dinajpur", bn: "দিনাজপুর" },
    { slug: "gaibandha", en: "Gaibandha", bn: "গাইবান্ধা" },
    { slug: "kurigram", en: "Kurigram", bn: "কুড়িগ্রাম" },
    { slug: "lalmonirhat", en: "Lalmonirhat", bn: "লালমনিরহাট" },
    { slug: "nilphamari", en: "Nilphamari", bn: "নীলফামারী" },
    { slug: "panchagarh", en: "Panchagarh", bn: "পঞ্চগড়" },
    { slug: "rangpur", en: "Rangpur", bn: "রংপুর" },
    { slug: "thakurgaon", en: "Thakurgaon", bn: "ঠাকুরগাঁও" },
  ],
  mymensingh: [
    { slug: "jamalpur", en: "Jamalpur", bn: "জামালপুর" },
    { slug: "mymensingh", en: "Mymensingh", bn: "ময়মনসিংহ" },
    { slug: "netrokona", en: "Netrokona", bn: "নেত্রকোণা" },
    { slug: "sherpur", en: "Sherpur", bn: "শেরপুর" },
  ],
};

/** Signup interests; keys match the API's domain.Interests. Labels live in messages → auth.interests. */
export const INTERESTS = [
  "backend",
  "frontend",
  "dsa",
  "system-design",
  "databases",
  "devops",
  "ai-ml",
  "mobile",
  "security",
  "competitive-programming",
] as const;

const BY_SLUG = new Map(
  Object.entries(DISTRICTS_BY_DIVISION).flatMap(([division, ds]) => ds.map((d) => [d.slug, { ...d, division: division as Division }] as const)),
);

/** A district's display name and division, or undefined for unknown slugs. */
export function districtInfo(slug: string | null | undefined) {
  return slug ? BY_SLUG.get(slug) : undefined;
}
