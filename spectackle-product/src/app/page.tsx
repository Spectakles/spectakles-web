import Home from '@/views/Home';
import StructuredData from '@/app/structured-data';
import { pageMetadata, pageStructuredData } from '@/lib/seo';

export const metadata = pageMetadata('/');

export default function Page() {
  return <><StructuredData data={pageStructuredData('/')} /><Home /></>;
}
