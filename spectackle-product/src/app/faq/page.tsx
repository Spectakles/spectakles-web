import FAQ from '@/views/FAQ';
import StructuredData from '@/app/structured-data';
import { pageMetadata, pageStructuredData } from '@/lib/seo';

export const metadata = pageMetadata('/faq');

export default function Page() {
  return <><StructuredData data={pageStructuredData('/faq')} /><FAQ /></>;
}
