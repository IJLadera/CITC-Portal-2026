 import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ExclamationCircleIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

type AlertType = "warning" | "success" | "error";

interface AlertProps {
  type: AlertType;
  title: string;
  message: string;
  onClose?: () => void;
  duration?: number;
}

const iconMap: Record<AlertType, React.ElementType> = {
  warning: ExclamationCircleIcon,
  success: CheckCircleIcon,
  error: XCircleIcon,
};

const colorMap: Record<
  AlertType,
  { bg: string; text: string; icon: string; bar: string }
> = {
  warning: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: "text-amber-500",
    bar: "bg-amber-500",
  },
  success: {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: "text-green-600",
    bar: "bg-green-600",
  },
  error: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: "text-red-500",
    bar: "bg-red-500",
  },
};

export default function COAlert({
  type,
  title,
  message,
  onClose,
  duration = 3000,
}: AlertProps) {
  const styles = colorMap[type];
  const Icon = iconMap[type];
  const alertRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!alertRef.current) return;

    gsap.fromTo(
      alertRef.current,
      { autoAlpha: 0, y: -40 },
      { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );

    if (progressRef.current) {
      gsap.fromTo(
        progressRef.current,
        { scaleX: 1 },
        { scaleX: 0, duration: duration / 1000, ease: "linear" }
      );
    }

    const timer = setTimeout(() => handleClose(), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    if (!alertRef.current) return;

    gsap.to(alertRef.current, {
      autoAlpha: 0,
      y: -40,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        onClose?.();
      },
    });
  };

  return (
    <div
      ref={alertRef}
      className={`${styles.bg} fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-6 shadow-md min-w-[320px] flex items-start rounded overflow-hidden`}
      role="alert"
    >
      <div className="py-1">
        <Icon className={`h-7 w-7 ${styles.icon} mr-4`} />
      </div>
      <div className="flex-1">
        <p className={`font-bold text-lg ${styles.text}`}>{title}</p>
        <p className="text-base font-semibold">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={handleClose}
          className={`${styles.text} hover:opacity-80 ml-4 font-bold text-3xl leading-none`}
        >
          ×
        </button>
      )}

      <div
        ref={progressRef}
        className={`${styles.bar} absolute bottom-0 left-0 h-1 w-full origin-left`}
      />
    </div>
  );
}
