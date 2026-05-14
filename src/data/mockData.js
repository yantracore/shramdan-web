export const lifecycleSteps = [
  "Listed",
  "Supported",
  "Campaign Ready",
  "Scheduled",
  "Active",
  "Completed",
  "Published"
];

export const statusMeta = {
  Listed: { color: "default", label: "Listed" },
  Supported: { color: "processing", label: "Supported" },
  "Campaign Ready": { color: "warning", label: "Campaign Ready" },
  Scheduled: { color: "cyan", label: "Scheduled" },
  Active: { color: "success", label: "Active" },
  Completed: { color: "green", label: "Completed" },
  Published: { color: "purple", label: "Published" }
};

export const issues = [
  {
    id: "issue-bagmati-bank",
    title: "Plastic waste along Bagmati riverbank",
    location: "Teku, Kathmandu",
    category: "Riverbank cleanup",
    status: "Campaign Ready",
    urgency: "High",
    supportCount: 248,
    readiness: 82,
    description:
      "Residents have reported visible plastic buildup near the walking path and informal dumping spots close to the river edge.",
    nextStep: "Confirm volunteers, bags, gloves, and waste transport."
  },
  {
    id: "issue-school-road",
    title: "Overflowing roadside waste near school lane",
    location: "Lalitpur Ward 8",
    category: "Roadside cleanup",
    status: "Supported",
    urgency: "Medium",
    supportCount: 133,
    readiness: 56,
    description:
      "A narrow school approach road has waste piles that make the morning commute difficult for students and parents.",
    nextStep: "Gather more local support and identify collection timing."
  },
  {
    id: "issue-park-corner",
    title: "Community park corner needs clearing",
    location: "Bhaktapur, Suryabinayak",
    category: "Park cleanup",
    status: "Listed",
    urgency: "Low",
    supportCount: 47,
    readiness: 24,
    description:
      "Dry leaves, broken branches, and scattered snack packaging have collected near the seating area.",
    nextStep: "Collect photos, estimate tools needed, and invite nearby residents."
  }
];

export const campaigns = [
  {
    id: "campaign-bagmati-cleanup",
    title: "Bagmati Riverbank Cleanup",
    location: "Teku bridge meeting point",
    date: "Saturday, 8:00 AM",
    status: "Scheduled",
    goal: "Clear visible plastic waste from a 500m riverbank stretch and document before-and-after proof for the community.",
    progress: 68,
    volunteers: 36,
    supporters: 248,
    needs: ["Gloves", "Reusable sacks", "Waste transport", "Photo documentation"],
    organizerNote:
      "Volunteers should bring water, wear sturdy shoes, and arrive 15 minutes early for grouping."
  }
];

export const contributionOptions = [
  {
    title: "Labor",
    icon: "team",
    detail: "Attend the cleanup and help collect, sort, or move waste safely."
  },
  {
    title: "Time",
    icon: "clock",
    detail: "Support coordination, outreach, check-in, or documentation."
  },
  {
    title: "Funds",
    icon: "fund",
    detail: "Show intent to support tools, refreshments, transport, or disposal costs."
  },
  {
    title: "Materials",
    icon: "tool",
    detail: "Offer gloves, sacks, brooms, masks, or cleanup supplies."
  },
  {
    title: "Logistics",
    icon: "truck",
    detail: "Help with waste pickup, transport, staging, or storage."
  },
  {
    title: "Share",
    icon: "share",
    detail: "Invite nearby residents and make the campaign easier to discover."
  }
];

export const impactStories = [
  {
    id: "story-sankhamul-park",
    title: "Sankhamul park entrance cleared",
    status: "Published",
    location: "Sankhamul, Kathmandu",
    participants: 42,
    contributionSummary: "64 sacks collected, 11 tool donations, 3 transport supporters.",
    result:
      "The walking entrance reopened with visible before-and-after proof and a short public summary of contributions."
  },
  {
    id: "story-patan-lane",
    title: "Patan lane waste point reset",
    status: "Completed",
    location: "Patan, Lalitpur",
    participants: 27,
    contributionSummary: "31 sacks collected, local shopkeepers provided gloves and drinking water.",
    result:
      "The cleanup team removed the blocked corner and documented follow-up needs for regular collection."
  }
];
