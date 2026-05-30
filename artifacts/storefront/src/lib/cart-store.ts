import { useState, useEffect, createContext, useContext } from "react";

// Cart drawer open/close state — simple module-level store
let listeners: Array<(open: boolean) => void> = [];
let isOpen = false;

export function openCartDrawer() {
  isOpen = true;
  listeners.forEach(l => l(true));
}

export function closeCartDrawer() {
  isOpen = false;
  listeners.forEach(l => l(false));
}

export function useCartDrawer() {
  const [open, setOpen] = useState(isOpen);
  useEffect(() => {
    listeners.push(setOpen);
    return () => { listeners = listeners.filter(l => l !== setOpen); };
  }, []);
  return { open, setOpen };
}
