package domain

import "slices"

// DistrictDivision maps each of Bangladesh's 64 districts to its division. Signup asks
// only for the district; the division (used by the leaderboard) follows from it.
var DistrictDivision = map[string]string{
	// Dhaka
	"dhaka": "dhaka", "faridpur": "dhaka", "gazipur": "dhaka", "gopalganj": "dhaka", "kishoreganj": "dhaka",
	"madaripur": "dhaka", "manikganj": "dhaka", "munshiganj": "dhaka", "narayanganj": "dhaka", "narsingdi": "dhaka",
	"rajbari": "dhaka", "shariatpur": "dhaka", "tangail": "dhaka",
	// Chattogram
	"bandarban": "chattogram", "brahmanbaria": "chattogram", "chandpur": "chattogram", "chattogram": "chattogram",
	"cumilla": "chattogram", "coxsbazar": "chattogram", "feni": "chattogram", "khagrachhari": "chattogram",
	"lakshmipur": "chattogram", "noakhali": "chattogram", "rangamati": "chattogram",
	// Rajshahi
	"bogura": "rajshahi", "joypurhat": "rajshahi", "naogaon": "rajshahi", "natore": "rajshahi",
	"chapainawabganj": "rajshahi", "pabna": "rajshahi", "rajshahi": "rajshahi", "sirajganj": "rajshahi",
	// Khulna
	"bagerhat": "khulna", "chuadanga": "khulna", "jashore": "khulna", "jhenaidah": "khulna", "khulna": "khulna",
	"kushtia": "khulna", "magura": "khulna", "meherpur": "khulna", "narail": "khulna", "satkhira": "khulna",
	// Barishal
	"barguna": "barishal", "barishal": "barishal", "bhola": "barishal", "jhalokathi": "barishal",
	"patuakhali": "barishal", "pirojpur": "barishal",
	// Sylhet
	"habiganj": "sylhet", "moulvibazar": "sylhet", "sunamganj": "sylhet", "sylhet": "sylhet",
	// Rangpur
	"dinajpur": "rangpur", "gaibandha": "rangpur", "kurigram": "rangpur", "lalmonirhat": "rangpur",
	"nilphamari": "rangpur", "panchagarh": "rangpur", "rangpur": "rangpur", "thakurgaon": "rangpur",
	// Mymensingh
	"jamalpur": "mymensingh", "mymensingh": "mymensingh", "netrokona": "mymensingh", "sherpur": "mymensingh",
}

func ValidDistrict(d string) bool { _, ok := DistrictDivision[d]; return ok }

// Interests a learner can pick at signup; they personalise what we suggest next.
var Interests = []string{
	"backend", "frontend", "dsa", "system-design", "databases",
	"devops", "ai-ml", "mobile", "security", "competitive-programming",
}

func ValidInterest(i string) bool { return slices.Contains(Interests, i) }

// JourneyStages are the milestones on the home-page journey, in order. A learner picks
// where they are at signup; the journey's sticky notes count learners per stage.
var JourneyStages = []string{"why", "programming", "dsa", "os", "networking", "system-design", "goal"}

func ValidJourneyStage(s string) bool { return slices.Contains(JourneyStages, s) }

// PathStats is how many learners there are, overall and at each journey stage.
type PathStats struct {
	Total  int64            `json:"total"`
	Stages map[string]int64 `json:"stages"`
}
