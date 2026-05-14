import { ArrowRightOutlined, EnvironmentOutlined, RiseOutlined } from "@ant-design/icons";
import { Button, Progress } from "antd";
import { StatusTag } from "@/components/StatusTag";

export function IssueCard({ issue }) {
  return (
    <article className="content-card issue-card">
      <div className="card-topline">
        <StatusTag status={issue.status} />
        <span className="urgency">{issue.urgency}</span>
      </div>
      <h3>{issue.title}</h3>
      <p>{issue.description}</p>
      <div className="meta-list">
        <span>
          <EnvironmentOutlined /> {issue.location}
        </span>
        <span>
          <RiseOutlined /> {issue.supportCount} supporters
        </span>
      </div>
      <div className="readiness">
        <span>Campaign readiness</span>
        <Progress percent={issue.readiness} size="small" strokeColor="#176b5c" />
      </div>
      <div className="next-step">{issue.nextStep}</div>
      <Button type="link" className="card-link">
        Support issue <ArrowRightOutlined />
      </Button>
    </article>
  );
}
