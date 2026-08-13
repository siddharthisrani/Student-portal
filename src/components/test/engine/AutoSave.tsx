"use client";

import { useEffect } from "react";

interface Props {
  onSave: () => Promise<void>;
}

export default function AutoSave({
  onSave,
}: Props) {

  useEffect(() => {

    const interval = setInterval(() => {

      onSave();

    }, 5000);

    return () => clearInterval(interval);

  }, [onSave]);

  return null;

}