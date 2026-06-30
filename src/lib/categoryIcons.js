import {
  FaEllipsis,
  FaFaucetDrip,
  FaMound,
  FaPersonHiking,
  FaRoad,
  FaTreeCity,
  FaWater
} from "react-icons/fa6";

// One glyph per issue/event/campaign category, keyed by the backend enum value
// (ISSUE_CATEGORIES in adminUtils). Every category Select — public filters, the
// report form, the member list — reads from this map, so a category looks the
// same everywhere. Icons come from react-icons/fa6, already the project's icon
// set (SiteShell uses it for the social row).
export const CATEGORY_ICONS = {
  ROADSIDE: FaRoad,
  VACANT_LAND: FaMound,
  RIVERBANK: FaWater,
  DRAINAGE: FaFaucetDrip,
  PARK_PUBLIC_SPACE: FaTreeCity,
  HIKING_TRAIL: FaPersonHiking,
  OTHER: FaEllipsis
};

// Wraps a category label with its leading icon for use as an antd Select option
// `label`. The node renders both in the open dropdown row and, once chosen, in
// the closed trigger. Mirrors the campaign status-dot pattern
// (.campaign-filter-opt in antd-dropdown.css). Unknown values fall back to text
// only, so a new backend category never renders a broken icon slot.
export function categoryOptionLabel(value, text) {
  const Icon = CATEGORY_ICONS[value];
  return (
    <span className="category-opt">
      {Icon ? <Icon className="category-opt-icon" aria-hidden /> : null}
      <span className="category-opt-text">{text}</span>
    </span>
  );
}
