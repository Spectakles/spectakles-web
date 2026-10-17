import About from '@/views/About';
import StructuredData from '@/app/structured-data';
import { pageMetadata, pageStructuredData } from '@/lib/seo';

export const metadata = pageMetadata('/about');

export default function Page() {
  return <><StructuredData data={pageStructuredData('/about')} /><About /></>;
}
