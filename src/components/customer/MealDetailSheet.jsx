import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import DietaryBadges from '@/components/shared/DietaryBadges';

export default function MealDetailSheet({ meals, initialIndex, onClose }) {
  const { t, getLocalizedField } = useI18n();
  const [index, setIndex] = useState(initialIndex ?? 0);
  const [direction, setDirection] = useState(0);

  // Separate y motion for the whole sheet — only used for notch-drag-to-close
  const sheetY = useMotionValue(0);
  const sheetOpacity = useTransform(sheetY, [0, 200], [1, 0]);

  // Track if currently swiping horizontally (to suppress vertical drag)
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingHorizontally = useRef(false);

  const meal = meals[index];
  const name = getLocalizedField(meal, 'name');
  const desc = getLocalizedField(meal, 'description');

  const goNext = () => {
    if (index < meals.length - 1) { setDirection(1); setIndex(i => i + 1); }
  };
  const goPrev = () => {
    if (index > 0) { setDirection(-1); setIndex(i => i - 1); }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — only draggable from notch area */}
      <motion.div
        key="sheet"
        style={{ y: sheetY, opacity: sheetOpacity }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[201] bg-card rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image at the very top — corners clipped by sheet's rounded-t-3xl */}
        <div className="relative w-full aspect-video bg-muted shrink-0 overflow-hidden">
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
              {meal.image_url ? (
                <img src={meal.image_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-muted text-6xl">
                  🍽️
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Notch overlay on top of image — drag here to close */}
          <motion.div
            className="absolute top-0 left-0 right-0 flex justify-center pt-3 pb-4 cursor-grab active:cursor-grabbing z-10"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            style={{ y: sheetY }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose();
              } else {
                sheetY.set(0);
              }
            }}
          >
            <div className="w-10 h-1.5 rounded-full bg-white/70 shadow" />
          </motion.div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Counter */}
          {meals.length > 1 && (
            <div className="absolute top-3 left-3 z-20 text-xs text-white bg-black/40 px-2.5 py-1 rounded-full font-medium">
              {index + 1} / {meals.length}
            </div>
          )}
        </div>

        {/* Swipeable info area */}
        <div className="overflow-hidden flex-1">
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
              className="select-none p-5 space-y-3 overflow-y-auto max-h-[40vh]"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-foreground leading-tight">{name}</h2>
                <span className="text-2xl font-bold text-primary shrink-0">
                  {t('currency')}{meal.price}
                </span>
              </div>
              {desc && <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>}
              <DietaryBadges tags={meal.dietary_tags} size="md" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Prev / Next arrows */}
        {meals.length > 1 && (
          <div className="flex justify-between px-4 pb-5 pt-1 gap-3 shrink-0">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-30 hover:bg-secondary/80 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={goNext}
              disabled={index === meals.length - 1}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-30 hover:bg-secondary/80 transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}