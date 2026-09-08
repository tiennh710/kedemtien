import Image from 'next/image';
import { FileSpreadsheet } from 'lucide-react';

import type { CatalogProduct } from '@/lib/catalog';

const tones: Record<string, { surface: string; ink: string }> = {
  indigo: { surface: 'from-[#eef0ff] via-[#dfe5ff] to-[#cbd5ff]', ink: 'text-[#3330b8]' },
  mint: { surface: 'from-[#e7fbf5] via-[#d3f6ec] to-[#bdebdc]', ink: 'text-[#087560]' },
  amber: { surface: 'from-[#fff6dd] via-[#ffedbe] to-[#ffdfa0]', ink: 'text-[#8b5a08]' },
  rose: { surface: 'from-[#fceafb] via-[#f4dcf4] to-[#e9c9eb]', ink: 'text-[#893b8b]' },
  sky: { surface: 'from-[#e9f7ff] via-[#d8effc] to-[#bee3f8]', ink: 'text-[#176384]' },
  violet: { surface: 'from-[#f1edff] via-[#e6ddff] to-[#d6c8ff]', ink: 'text-[#5a36b5]' },
};

export function ProductCover({ product, className = '' }: { product: CatalogProduct; className?: string }) {
  if (product.coverUrl) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        <Image
          src={product.coverUrl}
          alt={`Ảnh xem trước ${product.title}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }
  const tone = tones[product.coverTone] ?? tones.indigo;
  return (
    <div className={`flex h-full w-full items-end bg-gradient-to-br p-5 ${tone.surface} ${className}`}>
      <div className={`max-w-[88%] ${tone.ink}`}>
        <FileSpreadsheet className="mb-3 size-7" strokeWidth={2.2} />
        <p className="text-xl font-black leading-[1.03] tracking-[-0.045em]">{product.title}</p>
      </div>
    </div>
  );
}
