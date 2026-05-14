import { EnvironmentOutlined, TeamOutlined } from "@ant-design/icons";
import { StatusTag } from "@/components/StatusTag";

export function ImpactStoryCard({ story }) {
  return (
    <article className="content-card impact-card">
      <div className="image-placeholder" aria-label="Before and after evidence placeholder">
        <span>Before</span>
        <span>After</span>
      </div>
      <div className="card-topline">
        <StatusTag status={story.status} />
        <span>
          <TeamOutlined /> {story.participants} people
        </span>
      </div>
      <h3>{story.title}</h3>
      <div className="meta-list">
        <span>
          <EnvironmentOutlined /> {story.location}
        </span>
      </div>
      <p>{story.result}</p>
      <div className="next-step">{story.contributionSummary}</div>
    </article>
  );
}
