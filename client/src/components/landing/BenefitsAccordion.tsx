// @ts-nocheck
import React, { useId, useState } from 'react';

/*
 * "Why Choose Our Platform?" – expanding image cards.
 * One card is open at a time. Closed cards show their title written
 * vertically; the open card shows the title and description together.
 * Cards open on click / Enter / Space. On phones the cards stack
 * vertically and closed ones show the title horizontally.
 */

interface Benefit {
  icon: React.ElementType;
  title: string;
  description: string;
  image?: string;
  imagePosition?: string; // CSS object-position, keeps the subject in narrow cards
}

export const BenefitsAccordion: React.FC<{ items: Benefit[] }> = ({ items }) => {
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <ul className="flex flex-col gap-3 md:h-[440px] md:flex-row md:gap-4 lg:h-[500px]">
      {items.map((item, i) => {
        const Icon = item.icon;
        const isOpen = i === open;
        const descId = `${baseId}-desc-${i}`;
        return (
          <li
            key={item.title}
            className={`group relative overflow-hidden rounded-2xl bg-[#1e4341] transition-[flex-grow,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:min-w-[72px] md:basis-0 ${
              isOpen ? 'h-[360px] sm:h-[400px] md:h-auto md:grow-[6]' : 'h-20 md:h-auto md:grow'
            }`}
          >
            {/* photo */}
            {item.image && (
              <img
                src={item.image}
                alt=""
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 motion-reduce:transition-none ${
                  isOpen ? 'scale-100' : 'scale-105 group-hover:scale-110'
                }`}
                style={{ objectPosition: item.imagePosition || 'center' }}
              />
            )}
            {/* legibility overlays (solid tint on closed cards, soft fade at the bottom of the open card) */}
            <span
              className={`absolute inset-0 transition-opacity duration-500 ${
                isOpen ? 'opacity-0' : 'opacity-100'
              } bg-[#162326]/60 group-hover:bg-[#162326]/50`}
              aria-hidden="true"
            />
            <span
              className={`absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#162326]/90 via-[#162326]/45 to-transparent transition-opacity duration-500 ${
                isOpen ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden="true"
            />

            <h3 className="absolute inset-0 m-0">
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-expanded={isOpen}
                aria-describedby={descId}
                className="on-dark relative flex h-full w-full cursor-pointer flex-col text-left text-white focus-visible:outline-offset-[-4px]"
              >
                {/* icon – top-left on every card */}
                <span
                  className={`m-4 inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl backdrop-blur-sm transition-colors md:m-5 ${
                    isOpen ? 'bg-[#c14e0b] text-white' : 'bg-white/15 text-white ring-1 ring-inset ring-white/30'
                  } ${isOpen ? '' : 'max-md:absolute max-md:left-0 max-md:top-1/2 max-md:m-0 max-md:ml-4 max-md:-translate-y-1/2'}`}
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </span>

                {/* closed: vertical title (desktop) / horizontal title (phone) */}
                <span
                  className={`absolute transition-opacity duration-300 ${
                    isOpen ? 'pointer-events-none opacity-0' : 'opacity-100 delay-150'
                  } max-md:left-[4.5rem] max-md:top-1/2 max-md:-translate-y-1/2 md:bottom-6 md:left-1/2 md:-translate-x-1/2`}
                  aria-hidden={isOpen}
                >
                  <span className="block whitespace-nowrap text-lg font-semibold md:rotate-180 md:text-xl md:[writing-mode:vertical-rl]">
                    {item.title}
                  </span>
                </span>

                {/* keep the heading's accessible name when the vertical title is hidden */}
                {isOpen && <span className="sr-only">{item.title}</span>}
              </button>
            </h3>

            {/* open: title + description together (decorative copy; the button carries the name,
                and the description is linked with aria-describedby) */}
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 p-5 transition-all duration-500 md:p-7 ${
                isOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-3 opacity-0'
              }`}
            >
              <span className="type-h3 block text-white" aria-hidden="true">
                {item.title}
              </span>
              <p
                id={descId}
                className="type-body mt-2 max-w-md text-white/85"
              >
                {item.description}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
