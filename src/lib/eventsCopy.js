// Event-card / event-preview / event-map wording for the unified /campaigns
// surface. Lifted verbatim out of the retired /events listing page
// (EventsListClient's PAGE_COPY) when that page was deleted on 2026-07-02 —
// the copy outlived the page because CampaignsListClient renders the same
// event cards, preview pane, and map labels.
export const EVENTS_PAGE_COPY = {
  np: {
    pageTitle: "अभियानहरू",
    eyebrow: "अभियानहरू",
    title: "श्रमदान अभियानहरू",
    intro:
      "अहिले प्रसारणमा रहेका, आउँदै गरेका, र भर्खर सम्पन्न भएका सबै अभियानहरू। बायाँबाट कुनै पनि अभियान छान्नुहोस् — दायाँ प्यानलमा लाइभ प्रसारण र विवरण देखिनेछ।",
    sections: {
      live: { eyebrow: "अहिले लाइभ" },
      upcoming: { eyebrow: "आउँदै" },
      past: { eyebrow: "सम्पन्न" }
    },
    meta: {
      live: "लाइभ",
      in: "मा",
      ago: "अघि",
      participants: "सहभागी",
      durationMin: "{n} मिनेट",
      view: "विवरण हेर्ने"
    },
    filters: {
      ariaLabel: "अभियान फिल्टर",
      all: "सबै",
      allStatuses: "सबै स्थिति",
      planning: "तयारीमा",
      live: "लाइभ",
      upcoming: "आउँदै",
      past: "सम्पन्न",
      statusLabel: "स्थिति",
      statusPlaceholder: "सबै स्थिति",
      categoryLabel: "क्षेत्र",
      categoryPlaceholder: "सबै क्षेत्र",
      districtLabel: "जिल्ला",
      districtPlaceholder: "सबै जिल्ला",
      allDistricts: "सबै जिल्ला",
      sortLabel: "क्रमबद्ध",
      sortPlaceholder: "क्रम छान्नुहोस्",
      sortMostJoined: "सबैभन्दा बढी सहभागी",
      sortNewest: "नयाँ पहिले",
      sortNearest: "नजिकैका पहिले",
      sortLocating: "स्थान खोज्दै…",
      sortLocationDenied: "स्थान अनुमति अस्वीकृत भयो",
      sortLocationUnsupported: "ब्राउजरले स्थान समर्थन गर्दैन",
      searchingPrefix: "खोज्दै:",
      clearSearch: "खोज खाली गर्ने"
    },
    categoryLabels: {
      ROADSIDE: "सडक र फुटपाथ",
      VACANT_LAND: "खाली जग्गा",
      RIVERBANK: "नदी किनार",
      DRAINAGE: "ढल र नाला",
      PARK_PUBLIC_SPACE: "पार्क र सार्वजनिक स्थान",
      HIKING_TRAIL: "पदयात्रा मार्ग",
      OTHER: "अन्य"
    },
    preview: {
      empty: "बायाँबाट कुनै अभियान छान्नुहोस्।",
      back: "सूचीमा फर्कने",
      openFull: "पूर्ण विवरण हेर्ने",
      meetup: "भेला हुने ठाउँ र निर्देशन",
      roles: "सहभागीहरू",
      photos: "तस्वीरहरू",
      voices: "दिनको आवाज",
      result: "नतिजा सारांश",
      showMore: "थप पढ्ने",
      showLess: "छोटो बनाउने",
      campaignCreated: "अभियान सिर्जना भयो",
      campaignCreatedHint: "भेला हुने मिति तय हुँदै — तयारी सुरु भइसक्यो।",
      towardCampaign: "{x}/{y} जना जोडिनुभयो",
      risk: {
        NORMAL: "सामान्य जोखिम",
        WATCH: "ध्यान आवश्यक",
        HIGH: "उच्च जोखिम"
      }
    },
    list: {
      loadingMore: "थप अभियान ल्याउँदै…",
      noMore: "सबै अभियान देखाइए।"
    },
    map: {
      statusLabels: {
        live: "अहिले लाइभ",
        upcoming: "आउँदै",
        past: "सम्पन्न"
      },
      viewDetail: "विवरण",
      fullscreenOpen: "पूर्ण-स्क्रिन नक्सा खोल्ने",
      fullscreenClose: "पूर्ण-स्क्रिन नक्सा बन्द गर्ने"
    }
  },
  en: {
    pageTitle: "Events",
    eyebrow: "Events",
    title: "Shramdan Events",
    intro:
      "All campaigns — live, upcoming, and recently completed. Pick any event from the left; the live stream and details show on the right.",
    sections: {
      live: { eyebrow: "On now" },
      upcoming: { eyebrow: "Upcoming" },
      past: { eyebrow: "Completed" }
    },
    meta: {
      live: "LIVE",
      in: "in",
      ago: "ago",
      participants: "participants",
      durationMin: "{n} min",
      view: "View detail"
    },
    filters: {
      ariaLabel: "Filter campaigns",
      all: "All",
      allStatuses: "All Statuses",
      planning: "Planning",
      live: "Live",
      upcoming: "Upcoming",
      past: "Past",
      statusLabel: "Status",
      statusPlaceholder: "All Statuses",
      categoryLabel: "Category",
      categoryPlaceholder: "All Categories",
      districtLabel: "District",
      districtPlaceholder: "All Districts",
      allDistricts: "All Districts",
      sortLabel: "Sort By",
      sortPlaceholder: "Sort",
      sortMostJoined: "Most Joined",
      sortNewest: "Newest First",
      sortNearest: "Nearest to Me",
      sortLocating: "Locating…",
      sortLocationDenied: "Location permission denied",
      sortLocationUnsupported: "Browser does not support location",
      searchingPrefix: "Searching:",
      clearSearch: "Clear search"
    },
    categoryLabels: {
      ROADSIDE: "Roadside",
      VACANT_LAND: "Vacant land",
      RIVERBANK: "Riverbank",
      DRAINAGE: "Drainage",
      PARK_PUBLIC_SPACE: "Park / public space",
      HIKING_TRAIL: "Hiking trail",
      OTHER: "Other"
    },
    preview: {
      empty: "Pick a campaign from the list to see details here.",
      back: "Back to list",
      openFull: "Open Full Event Page",
      meetup: "Meetup details",
      roles: "Participants",
      photos: "Photos",
      voices: "Voices from the day",
      result: "Result summary",
      showMore: "Show more",
      showLess: "Show less",
      campaignCreated: "Campaign created",
      campaignCreatedHint: "A meetup date is being set — planning has begun.",
      towardCampaign: "{x}/{y} joined",
      risk: {
        NORMAL: "Normal risk",
        WATCH: "Heads-up",
        HIGH: "High risk"
      }
    },
    list: {
      loadingMore: "Loading more campaigns…",
      noMore: "All campaigns shown."
    },
    map: {
      statusLabels: {
        live: "On now",
        upcoming: "Upcoming",
        past: "Completed"
      },
      viewDetail: "View",
      fullscreenOpen: "Open fullscreen map",
      fullscreenClose: "Close fullscreen map"
    }
  }
};
