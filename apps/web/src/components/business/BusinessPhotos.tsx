import Image from "next/image";

interface BusinessPhotosProps {
  businessName: string;
  photos?: string[];
}

export function BusinessPhotos({
  businessName,
  photos = [],
}: BusinessPhotosProps) {
  // Use placeholder images if no photos provided
  const displayPhotos = photos.length > 0 ? photos : [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", // Wine bar
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80", // Wine glasses
    "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80", // Wine bottles on shelf
  ];

  if (displayPhotos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3 h-auto md:h-[420px]">
      {/* Main photo - larger on desktop */}
      <div className="md:col-span-2 md:row-span-2 relative rounded-xl overflow-hidden group h-[280px] md:h-auto">
        <Image
          src={displayPhotos[0]}
          alt={`${businessName} photo 1`}
          fill
          className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Secondary photos */}
      {displayPhotos.slice(1, 3).map((photo, idx) => (
        <div
          key={idx}
          className="md:col-span-2 relative rounded-xl overflow-hidden group h-[180px] md:h-auto"
        >
          <Image
            src={photo}
            alt={`${businessName} photo ${idx + 2}`}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ))}
    </div>
  );
}

