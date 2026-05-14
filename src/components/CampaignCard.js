import {
  CalendarOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  ToolOutlined
} from "@ant-design/icons";
import { Button, Progress } from "antd";
import { StatusTag } from "@/components/StatusTag";

export function CampaignCard({ campaign, featured = false }) {
  return (
    <article className={featured ? "content-card campaign-card featured" : "content-card campaign-card"}>
      <div className="card-topline">
        <StatusTag status={campaign.status} />
        <span>{campaign.progress}% pledged</span>
      </div>
      <h3>{campaign.title}</h3>
      <p>{campaign.goal}</p>
      <div className="meta-list">
        <span>
          <EnvironmentOutlined /> {campaign.location}
        </span>
        <span>
          <CalendarOutlined /> {campaign.date}
        </span>
      </div>
      <Progress percent={campaign.progress} strokeColor="#176b5c" railColor="#d8e8df" />
      <div className="needs-list" aria-label="Campaign needs">
        {campaign.needs.map((need) => (
          <span key={need}>
            <ToolOutlined /> {need}
          </span>
        ))}
      </div>
      <div className="organizer-note">
        <CheckCircleOutlined />
        <span>{campaign.organizerNote}</span>
      </div>
      <Button type="primary" block>
        Register participation intent
      </Button>
    </article>
  );
}
