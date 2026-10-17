"use client";

import { Suspense, type ReactNode } from 'react';
import Layout from '../components/Layout';
import AsciiWavesBackground from '../components/AsciiWavesBackground';
import AnalyticsTracker from '../components/AnalyticsTracker';

export default function SiteShell({ children }: { children: ReactNode }) {
  return <><Suspense fallback={null}><AnalyticsTracker /></Suspense><AsciiWavesBackground /><Layout>{children}</Layout></>;
}
