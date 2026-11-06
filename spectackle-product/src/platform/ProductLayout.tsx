import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { PlatformProvider } from './Platform';

/** Load identity and backend state only after entering the learner application. */
export default function ProductLayout() {
  useEffect(() => {
    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = robots?.content;
    if (robots) robots.content = 'noindex, nofollow';
    return () => { if (robots && previous) robots.content = previous; };
  }, []);
  return <PlatformProvider><Outlet /></PlatformProvider>;
}
