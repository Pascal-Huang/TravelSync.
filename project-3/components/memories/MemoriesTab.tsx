"use client";

import { useEffect, useState } from "react";
import { PhotoTimeline } from "./PhotoTimeline";
import type { TripPhoto, LinkedAlbum } from "@/lib/tripPhotos";

interface Props {
  tripId: string;
  tripStartDate: string | null;
}

function getStoredUserId(): string | null {
  try {
    const raw = localStorage.getItem("travelsync:auth-user");
    if (!raw) return null;
    return JSON.parse(raw).id ?? null;
  } catch {
    return null;
  }
}

export function MemoriesTab({ tripId, tripStartDate }: Props) {
  const [photos, setPhotos]   = useState<TripPhoto[]>([]);
  const [album, setAlbum]     = useState<LinkedAlbum | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getStoredUserId();
    if (!userId) { setLoading(false); return; }
    fetch(`/api/trips/${tripId}/photos?userId=${userId}`)
      .then((r) => r.json())
      .then(({ photos, album }) => {
        setPhotos(photos ?? []);
        setAlbum(album ?? null);
      })
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) {
    return (
      <p className="text-sm text-ink-faint py-8 text-center font-sans animate-pulse">
        Loading memories…
      </p>
    );
  }

  if (!album) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink-mid text-sm font-sans">No photo album linked to this trip.</p>
        <p className="text-ink-faint text-xs mt-1 font-sans">
          Open PhotoSync, create an album, and link it to this trip.
        </p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink-mid text-sm font-sans">"{album.name}" is linked but has no photos yet.</p>
        <p className="text-ink-faint text-xs mt-1 font-sans">Upload photos in PhotoSync to see them here.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-ink-faint mb-4 font-sans">{album.name} · {photos.length} photos</p>
      <PhotoTimeline photos={photos} tripStartDate={tripStartDate} />
    </div>
  );
}
