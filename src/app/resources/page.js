"use client";

import {
  ApiOutlined,
  FilePptOutlined,
  FileTextOutlined,
  GithubOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined,
  YoutubeOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import { MotionSection } from "@/components/MotionSection";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

const resourceIcons = {
  participate: VideoCameraOutlined,
  watchLive: YoutubeOutlined,
  discord: MessageOutlined,
  apiDocs: ApiOutlined,
  presentation: FilePptOutlined,
  documents: FileTextOutlined,
  github: GithubOutlined,
  roadmap: UnorderedListOutlined
};

export default function ResourcesPage() {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;

  return (
    <SiteShell pageTitle={t.resources.pageTitle}>
      <MotionSection as="section" className="page-section resources-section" aria-labelledby="resources-title">
        <div className="section-heading resources-heading">
          <span className="eyebrow">{t.resources.eyebrow}</span>
          <h2 id="resources-title">{t.resources.title}</h2>
          <p>{t.resources.intro}</p>
        </div>

        <article className="resources-playlist-card">
          <div className="resources-playlist-copy">
            <span className="resource-icon resources-playlist-icon" aria-hidden="true">
              <PlayCircleOutlined />
            </span>
            <div>
              <h3>{t.resources.playlist.title}</h3>
              <p>{t.resources.playlist.description}</p>
            </div>
            <div className="resources-playlist-action">
              <Button
                href={t.resources.playlist.playlistUrl}
                target="_blank"
                rel="noreferrer"
                icon={<YoutubeOutlined />}
              >
                {t.resources.playlist.button}
              </Button>
            </div>
          </div>
          <div className="resources-playlist-frame">
            <iframe
              src={t.resources.playlist.embedUrl}
              title={t.resources.playlist.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </article>

        <div className="resources-grid">
          {t.resources.items.map((item) => {
            const Icon = resourceIcons[item.id] ?? FileTextOutlined;

            return (
              <article className="resource-card" key={item.id}>
                <span className="resource-icon" aria-hidden="true">
                  <Icon />
                </span>
                <div className="resource-card-copy">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <Button href={item.href} rel="noreferrer" target="_blank" icon={<Icon />}>
                  {item.button}
                </Button>
              </article>
            );
          })}
        </div>
      </MotionSection>
    </SiteShell>
  );
}
