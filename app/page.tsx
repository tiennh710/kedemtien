import { Marketplace } from '@/components/marketplace';
import { listProducts } from '@/lib/server/database';

export const dynamic = 'force-dynamic';

export default async function Home() {
  return <Marketplace products={await listProducts()} />;
}
