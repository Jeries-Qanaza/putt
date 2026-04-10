import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import DietaryBadges from '@/components/shared/DietaryBadges';

export default function MealDetailSheet({ meals, initialIndex, onClose, fallbackImage }) {
  const { t, getLocalizedField } = useI18n();
  const [index, setIndex] = useState(initialIndex ?? 0);
  const [direction, setDirection] = useState(0);

  const sheetY = useMotionValue(0);
  const sheetOpacity = useTransform(sheetY, [0, 200], [1, 0]);

  const meal = meals[index];
  const name = getLocalizedField(meal, 'name');
  const desc = getLocalizedField(meal, 'description');
  const imageUrl = meal.image_url || fallbackImage;

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
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, meals.length, onClose]);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
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
        className="fixed bottom-0 left-0 right-0 z-[201] flex max-h-[90vh] flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl md:left-1/2 md:right-auto md:top-1/2 md:bottom-auto md:w-[60vw] md:max-w-4xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative w-full shrink-0 overflow-hidden bg-muted aspect-video md:aspect-[16/6]">
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
              {imageUrl ? (
                <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-muted text-6xl">
                  *
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="absolute left-0 right-0 top-0 z-10 flex cursor-grab justify-center pt-3 pb-4 active:cursor-grabbing"
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

          {meals.length > 1 ? (
            <div className="absolute top-3 left-3 z-20 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} / {meals.length}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-hidden">
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
              className="max-h-[42vh] select-none space-y-3 overflow-y-auto p-5 md:max-h-[40vh]"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold leading-tight text-foreground">{name}</h2>
                <span className="shrink-0 text-2xl font-bold text-primary">
                  {t('currency')}
                  {meal.price}
                </span>
              </div>
              {desc ? <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p> : null}
              <DietaryBadges tags={meal.dietary_tags} size="md" />
            </motion.div>
          </AnimatePresence>
        </div>

        {meals.length > 1 ? (
          <div className="flex shrink-0 justify-between gap-3 px-4 pt-1 pb-5">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              onClick={goNext}
              disabled={index === meals.length - 1}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-30"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
