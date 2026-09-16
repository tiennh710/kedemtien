import { Marketplace } from '@/components/marketplace';
import { demoProducts } from '@/lib/catalog';
import { listProducts } from '@/lib/server/database';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = process.env.POSTGRES_URL
    ? await listProducts()
    : demoProducts;
  return <Marketplace products={products} />;
}
