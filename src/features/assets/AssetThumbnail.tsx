import { thumbnailUrl } from "@/api/client";
import { Asset } from "@/lib/types";
import { useState } from "react";

export const AssetThumbnail = ({ asset }: { asset: Asset }) => {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <div
        className="card__thumb card__thumb--missing"
        aria-label="Thumbnail unavailable"
      >
        Thumbnail unavailable
      </div>
    );
  }

  return (
    <img
      className="card__thumb"
      src={thumbnailUrl(asset.id)}
      alt={asset.name}
      onError={() => setImageFailed(true)}
    />
  );
};
