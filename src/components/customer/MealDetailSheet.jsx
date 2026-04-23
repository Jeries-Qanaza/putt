import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import DietaryBadges from '@/components/shared/DietaryBadges';

function preloadImage(src) {
  if (!src) return Promise.resolve();

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
  });
}

export default function MealDetailSheet({ meals, initialIndex, onClose, fallbackImage }) {
  const { t, getLocalizedField, isRTL } = useI18n();
  const [index, setIndex] = useState(initialIndex ?? 0);
  const [direction, setDirection] = useState(0);
  const contentRef = useRef(null);
  const touchStartYRef = useRef(null);

  const sheetY = useMotionValue(0);
  const sheetOpacity = useTransform(sheetY, [0, 200], [1, 0]);

  const meal = meals[index];
  const name = getLocalizedField(meal, 'name');
  const desc = getLocalizedField(meal, 'description');
  const primaryImage = meal.image_url || fallbackImage || '';
  const [currentImage, setCurrentImage] = useState(primaryImage);
  const imageSources = useMemo(
    () => meals.map((item) => item.image_url || fallbackImage || ''),
    [meals, fallbackImage]
  );

  useEffect(() => {
    setCurrentImage(primaryImage);
  }, [primaryImage, index]);

  useEffect(() => {
    const preloadTargets = [imageSources[index], imageSources[index - 1], imageSources[index + 1]]
      .filter(Boolean);

    preloadTargets.forEach((src) => {
      preloadImage(src);
    });
  }, [imageSources, index]);

  const goNext = () => {
    if (index < meals.length - 1) {
      setDirection(1);
      setIndex((value) => value + 1);
    }
  };

  const goPrev = () => {
    if (index > 0) {
      setDirection(-1);
      setIndex((value) => value - 1);
    }
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') (isRTL ? goPrev() : goNext());
      if (event.key === 'ArrowLeft') (isRTL ? goNext() : goPrev());
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, isRTL, meals.length, onClose]);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  const forwardScrollToPage = (deltaY) => {
    if (!deltaY) return false;
    window.scrollBy({ top: deltaY, behavior: 'auto' });
    return true;
  };

  const handleWheel = (event) => {
    const container = contentRef.current;
    if (!container) return;

    const scrollingDown = event.deltaY > 0;
    const scrollingUp = event.deltaY < 0;
    const atTop = container.scrollTop <= 0;
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;

    if ((scrollingUp && atTop) || (scrollingDown && atBottom)) {
      event.preventDefault();
      forwardScrollToPage(event.deltaY);
    }
  };

  const handleTouchStart = (event) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event) => {
    const container = contentRef.current;
    const currentY = event.touches[0]?.clientY;

    if (!container || currentY == null || touchStartYRef.current == null) return;

    const deltaY = touchStartYRef.current - currentY;
    const draggingDown = deltaY < 0;
    const draggingUp = deltaY > 0;
    const atTop = container.scrollTop <= 0;
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;

    if ((draggingDown && atTop) || (draggingUp && atBottom)) {
      forwardScrollToPage(deltaY);
      touchStartYRef.current = currentY;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        key="sheet"
        style={{ y: sheetY, opacity: sheetOpacity }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[201] flex max-h-[90vh] flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl md:inset-[8vh_10vw] md:max-h-none md:rounded-[2rem] md:border md:border-border/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative w-full shrink-0 overflow-hidden bg-muted aspect-video md:hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={`img-${index}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute inset-0"
            >
              {currentImage ? (
                <img
                  src={currentImage}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => {
                    if (currentImage !== fallbackImage && fallbackImage) {
                      setCurrentImage(fallbackImage);
                      return;
                    }
                    setCurrentImage('');
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-muted text-6xl">
                  *
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="absolute left-0 right-0 top-0 z-10 flex cursor-grab justify-center pt-3 pb-4 active:cursor-grabbing md:hidden"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            style={{ y: sheetY }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
              else sheetY.set(0);
            }}
          >
            <div className="h-1.5 w-10 rounded-full bg-white/70 shadow" />
          </motion.div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute top-3 left-3 z-20 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white">
            {index + 1} / {meals.length}
          </div>
        </div>

        <div className="hidden items-start gap-6 border-b border-border/60 bg-card px-8 py-7 md:flex">
          <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-muted">
            {currentImage ? (
              <img
                src={currentImage}
                alt=""
                className="h-full w-full object-cover"
                onError={() => {
                  if (currentImage !== fallbackImage && fallbackImage) {
                    setCurrentImage(fallbackImage);
                    return;
                  }
                  setCurrentImage('');
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-muted text-5xl">
                *
              </div>
            )}
            <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} / {meals.length}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t('mealLabel')}</p>
                <h2 className="text-3xl font-bold leading-tight text-foreground">{name}</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-foreground transition-colors hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <span className="inline-flex max-w-full items-center rounded-full bg-primary/10 px-4 py-2 text-2xl font-bold text-primary ltr" dir="ltr">
                <span className="pe-2">{t('currency')}</span>
                <span>{meal.price}</span>
              </span>
            </div>
            {desc ? <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">{desc}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <DietaryBadges tags={meal.dietary_tags} size="md" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-card">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={index}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) goNext();
                else if (info.offset.x > 80) goPrev();
              }}
              ref={contentRef}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              className="max-h-[42vh] select-none overflow-y-auto p-5 md:max-h-[calc(84vh-20rem)] md:px-8 md:py-7"
            >
              <div className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5 shadow-sm md:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground md:hidden">{t('mealLabel')}</div>
                    <h2 className="text-xl font-bold leading-tight text-foreground">{name}</h2>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-lg font-bold text-primary ltr" dir="ltr">
                    <span className="pe-1">{t('currency')}</span>
                    <span>{meal.price}</span>
                  </span>
                </div>
                {desc ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{desc}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <DietaryBadges tags={meal.dietary_tags} size="md" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {meals.length > 1 ? (
          <div className="flex shrink-0 justify-between gap-3 px-4 pt-1 pb-5 md:px-8 md:pb-7" dir="ltr">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-30"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('previous')}
            </button>
            <button
              onClick={goNext}
              disabled={index === meals.length - 1}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-30"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {t('next')}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
