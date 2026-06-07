"use client";

import Image from "next/image";
import { groupPhotosByDay } from "@/lib/groupPhotos";
import type { TripPhoto } from "@/lib/tripPhotos";

interface Props {
  photos: TripPhoto[];
  tripStartDate: string | null;
}

export function PhotoTimeline({ photos, tripStartDate }: Props) {
  if (!tripStartDate || !photos.every((p) => p.taken_at !== null)) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <PhotoThumb key={photo.id} photo={photo} />
        ))}
      </div>
    );
  }

  const groups = groupPhotosByDay(photos, tripStartDate);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <div key={group.date}>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-3 font-sans">
            {group.label}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {group.photos.map((photo) => (
              <PhotoThumb key={photo.id} photo={photo} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotoThumb({ photo }: { photo: TripPhoto }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-[10px] bg-cream-deep">
      <Image
        src={photo.storage_url}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 768px) 33vw, 200px"
      />
    </div>
  );
}
