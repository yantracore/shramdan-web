import {
  ClockCircleOutlined,
  DollarOutlined,
  ShareAltOutlined,
  ToolOutlined,
  TruckOutlined,
  UsergroupAddOutlined
} from "@ant-design/icons";

const icons = {
  team: UsergroupAddOutlined,
  clock: ClockCircleOutlined,
  fund: DollarOutlined,
  tool: ToolOutlined,
  truck: TruckOutlined,
  share: ShareAltOutlined
};

export function ContributionOption({ option }) {
  const Icon = icons[option.icon] ?? ToolOutlined;

  return (
    <article className="option-card">
      <span className="option-icon" aria-hidden="true">
        <Icon />
      </span>
      <h3>{option.title}</h3>
      <p>{option.detail}</p>
    </article>
  );
}
