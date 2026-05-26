"use client";

import { CloseOutlined, ExpandOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import Image from "next/image";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Navigation, Pagination, Thumbs } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";

export function IssuePhotoGallery({ images, title, content }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const isSingle = images.length === 1;

  return (
    <div className="public-issue-gallery" aria-label={content.detail.galleryAria}>
      {isSingle ? (
        <button
          className="public-issue-gallery-single"
          onClick={() => openLightbox(0)}
          type="button"
          aria-label={content.detail.viewPhoto}
        >
          <Image
            alt={title}
            height={720}
            src={images[0].url}
            unoptimized
            width={1280}
            sizes="(max-width: 768px) 100vw, 1180px"
          />
          <span className="public-issue-gallery-expand" aria-hidden="true">
            <ExpandOutlined />
          </span>
        </button>
      ) : (
        <>
          <Swiper
            className="public-issue-gallery-main"
            modules={[Navigation, Pagination, Keyboard, A11y, Thumbs]}
            navigation
            pagination={{ clickable: true }}
            keyboard={{ enabled: true }}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            spaceBetween={0}
            slidesPerView={1}
            loop={images.length > 2}
          >
            {images.map((upload, index) => (
              <SwiperSlide key={upload.id || upload.url}>
                <button
                  className="public-issue-gallery-slide-button"
                  onClick={() => openLightbox(index)}
                  type="button"
                  aria-label={content.detail.viewPhoto}
                >
                  <Image
                    alt={title}
                    height={720}
                    src={upload.url}
                    unoptimized
                    width={1280}
                    sizes="(max-width: 768px) 100vw, 1180px"
                    priority={index === 0}
                  />
                  <span className="public-issue-gallery-expand" aria-hidden="true">
                    <ExpandOutlined />
                  </span>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
          <Swiper
            className="public-issue-gallery-thumbs"
            modules={[Thumbs, A11y]}
            onSwiper={setThumbsSwiper}
            spaceBetween={8}
            slidesPerView="auto"
            watchSlidesProgress
            freeMode
          >
            {images.map((upload) => (
              <SwiperSlide
                key={`thumb-${upload.id || upload.url}`}
                className="public-issue-gallery-thumb"
              >
                <Image
                  alt={title}
                  height={120}
                  src={upload.url}
                  unoptimized
                  width={160}
                  sizes="160px"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </>
      )}

      <Modal
        open={lightboxOpen}
        onCancel={() => setLightboxOpen(false)}
        footer={null}
        closeIcon={<CloseOutlined />}
        width="92vw"
        centered
        destroyOnHidden
        className="public-issue-lightbox-modal"
        wrapClassName="public-issue-lightbox-wrap"
      >
        <Swiper
          modules={[Navigation, Pagination, Keyboard, A11y]}
          navigation
          pagination={{ clickable: true }}
          keyboard={{ enabled: true }}
          initialSlide={lightboxIndex}
          spaceBetween={16}
          slidesPerView={1}
          className="public-issue-lightbox-swiper"
        >
          {images.map((upload) => (
            <SwiperSlide key={`lightbox-${upload.id || upload.url}`}>
              <div className="public-issue-lightbox-slide">
                <Image
                  alt={title}
                  height={1080}
                  src={upload.url}
                  unoptimized
                  width={1920}
                  sizes="92vw"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </Modal>
    </div>
  );
}
