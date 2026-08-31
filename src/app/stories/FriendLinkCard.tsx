"use client";

import React from "react";
import { friendLinksCopy, type FriendLink } from "@/lib/friendLinks";
import { cn } from "@/lib/utils";

function linkHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function FriendLinkCard({
  link,
  confirming,
  onOpen,
  onCancel,
  onGo,
}: {
  link: FriendLink;
  confirming: boolean;
  onOpen: () => void;
  onCancel: () => void;
  onGo: () => void;
}) {
  const host = linkHost(link.url);

  return (
    <article
      data-friend-card={link.cover ? "covered" : "tonal"}
      className={cn(
        "friend-card relative aspect-[4/3] overflow-hidden rounded-[var(--md-sys-shape-corner-large-increased)] border",
        !link.cover && "friend-card--tonal",
        confirming && "friend-card--flipped",
      )}
    >
      <div className="friend-card__inner">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`访问 ${link.name}`}
          tabIndex={confirming ? -1 : 0}
          aria-hidden={confirming || undefined}
          className="friend-card__face friend-card__front absolute inset-0 flex h-full w-full flex-col justify-end p-6 text-left min-[840px]:p-7"
        >
          {link.cover ? (
            <img
              src={link.cover}
              alt={link.name}
              loading="lazy"
              decoding="async"
              className="friend-card__media absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <svg
              data-friend-motif="link"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="friend-card__motif absolute right-0 top-0 h-[62%] w-[74%]"
              fill="none"
            >
              <path d="M9 17H7A5 5 0 0 1 7 7h2" />
              <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
              <path d="m8 12h8" />
            </svg>
          )}

          <div className="relative z-10 max-w-[92%]">
            <h2 className="mb-2 line-clamp-3 text-title-large font-semibold leading-snug text-[var(--md-sys-color-on-surface)]">
              {link.name}
            </h2>
          </div>
        </button>

        <div className="friend-card__face friend-card__back absolute inset-0 flex flex-col justify-end gap-3 p-6 min-[840px]:p-7">
          <p className="text-title-medium font-semibold text-[var(--md-sys-color-on-surface)]">
            {friendLinksCopy.confirmNote}
          </p>
          {link.description && (
            <p className="line-clamp-3 text-body-medium text-[var(--md-sys-color-on-surface-variant)]">
              {link.description}
            </p>
          )}
          <p className="text-body-medium text-[var(--md-sys-color-on-surface-variant)]">{host}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onGo}
              tabIndex={confirming ? 0 : -1}
              aria-hidden={!confirming || undefined}
              className="friend-card__go rounded-full px-5 py-3 text-label-large font-semibold"
            >
              {friendLinksCopy.confirmGo}
            </button>
            <button
              type="button"
              onClick={onCancel}
              tabIndex={confirming ? 0 : -1}
              aria-hidden={!confirming || undefined}
              className="friend-card__cancel rounded-full px-5 py-3 text-label-large font-semibold"
            >
              {friendLinksCopy.confirmCancel}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function FriendLinksGrid({
  links,
  confirmingId,
  onOpen,
  onCancel,
  onGo,
  emptyText,
}: {
  links: FriendLink[];
  confirmingId: string | null;
  onOpen: (id: string) => void;
  onCancel: () => void;
  onGo: (link: FriendLink) => void;
  emptyText: string;
}) {
  if (links.length === 0) {
    return (
      <div className="stories-rise rounded-[28px] border border-white/10 bg-white/[0.04] p-10 text-center text-body-large text-white/58">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="stories-rise grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[840px]:grid-cols-3 min-[1200px]:gap-6">
      {links.map((link) => (
        <FriendLinkCard
          key={link.id}
          link={link}
          confirming={confirmingId === link.id}
          onOpen={() => onOpen(link.id)}
          onCancel={onCancel}
          onGo={() => onGo(link)}
        />
      ))}
    </div>
  );
}
