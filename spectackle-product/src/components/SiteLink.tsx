"use client";

import NextLink from 'next/link';
import type { ComponentProps } from 'react';

export default function SiteLink({ onClick, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink {...props} scroll={false} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank') return;
    const target = new URL(event.currentTarget.href);
    if (target.origin === window.location.origin && target.pathname === window.location.pathname && target.search === window.location.search) {
      event.preventDefault();
      window.history.pushState(null, '', target.href);
      window.dispatchEvent(new Event('spectakles:navigation'));
    }
  }} />;
}
