'use client';

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { FileSpreadsheet, Loader2, LogOut, PackagePlus, RefreshCcw, Send, ShoppingBag } from 'lucide-react';
import { SubmitEvent, useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatVnd, type CatalogProduct, type ProductStatus } from '@/lib/catalog';
import { apiError, readJson } from '@/lib/client/api';

type Order = { id: number; order_code: number; email: string; status: string; amount_total: number; delivery_status: string; delivery_error?: string; created_at: number; items: string };
type UploadTicket = { bucket: string; path: string; token: string; version?: number; contentType: string };

const excelType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
let storageClient: ReturnType<typeof createClient> | undefined;

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase chưa được cấu hình cho trình duyệt.');
  storageClient ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return storageClient;
}

async function uploadDirect(productId: number, kind: 'asset' | 'image', file: File) {
  const response = await fetch('/api/admin/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, kind, filename: file.name, contentType: file.type || (kind === 'asset' ? excelType : ''), size: file.size }) });
  const ticket = await readJson<UploadTicket & { error?: string }>(response);
  if (!response.ok || !ticket.token) throw new Error(apiError(ticket, 'Không thể cấp quyền upload.'));
  const { error } = await getStorageClient().storage.from(ticket.bucket).uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: ticket.contentType });
  if (error) throw error;
  return ticket;
}

async function sha256File(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function formText(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

export function AdminPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try {
      const [productResponse, orderResponse] = await Promise.all([fetch('/api/admin/products'), fetch('/api/admin/orders')]);
      if (productResponse.status === 401 || orderResponse.status === 401) { window.location.href = '/dang-nhap?returnTo=/admin'; return; }
      const productData = await readJson<{ products?: CatalogProduct[]; error?: string }>(productResponse); const orderData = await readJson<{ orders?: Order[]; error?: string }>(orderResponse);
      if (!productResponse.ok || !productData.products) throw new Error(apiError(productData, 'Không thể tải sản phẩm.')); if (!orderResponse.ok || !orderData.orders) throw new Error(apiError(orderData, 'Không thể tải đơn hàng.'));
      setProducts(productData.products); setOrders(orderData.orders);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể tải dữ liệu quản trị.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  async function createProduct(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      const formElement = event.currentTarget;
      const form = new FormData(formElement);
      const file = form.get('file');
      const images = form.getAll('images').filter((item): item is File => item instanceof File && item.size > 0);
      if (!(file instanceof File) || !images.length) throw new Error('Vui lòng chọn file XLSX và ít nhất một ảnh.');
      const payload = { title: formText(form, 'title'), category: formText(form, 'category'), priceVnd: Number(form.get('priceVnd')), shortDescription: formText(form, 'shortDescription'), description: formText(form, 'description'), licenseNote: formText(form, 'licenseNote'), status: form.get('status') === 'published' ? 'published' : 'draft' };
      const response = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await readJson<{ productId?: number; error?: string }>(response); if (!response.ok || !data.productId) throw new Error(apiError(data, 'Không thể tạo sản phẩm.'));
      const assetTicket = await uploadDirect(data.productId, 'asset', file);
      const imageTickets = await Promise.all(images.map((image) => uploadDirect(data.productId!, 'image', image)));
      const finalizeResponse = await fetch(`/api/admin/products/${data.productId}/uploads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ asset: { path: assetTicket.path, filename: file.name, contentType: excelType, size: file.size, sha256: await sha256File(file), version: assetTicket.version }, images: imageTickets.map((ticket, index) => ({ path: ticket.path, contentType: images[index].type, size: images[index].size, altText: `${payload.title} — ảnh ${index + 1}`, sortOrder: index })) }) });
      const finalized = await readJson<{ error?: string }>(finalizeResponse); if (!finalizeResponse.ok) throw new Error(apiError(finalized, 'Không thể hoàn tất sản phẩm.'));
      formElement.reset(); setMessage('Đã tạo sản phẩm và lưu file an toàn.'); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể tạo sản phẩm.'); }
    finally { setSaving(false); }
  }

  async function updateProduct(product: CatalogProduct, changes: { status?: ProductStatus; priceVnd?: number; title?: string }) {
    setSaving(true); setMessage('');
    try { const response = await fetch(`/api/admin/products/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) }); const data = await readJson<{ product?: CatalogProduct; error?: string }>(response); if (!response.ok || !data.product) throw new Error(apiError(data, 'Không thể cập nhật sản phẩm.')); setProducts((current) => current.map((item) => item.id === product.id ? data.product! : item)); setMessage('Đã cập nhật sản phẩm.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể cập nhật.'); }
    finally { setSaving(false); }
  }

  async function replaceAsset(productId: number, file: File | null) {
    if (!file) return; setSaving(true); setMessage('');
    try { const ticket = await uploadDirect(productId, 'asset', file); const response = await fetch(`/api/admin/products/${productId}/asset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: ticket.path, filename: file.name, contentType: excelType, size: file.size, sha256: await sha256File(file), version: ticket.version }) }); const data = await readJson<{ version?: number; error?: string }>(response); if (!response.ok || !data.version) throw new Error(apiError(data, 'Không thể thay file.')); setMessage(`Đã thêm phiên bản ${data.version}. Đơn cũ vẫn giữ file đã mua.`); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể thay file.'); }
    finally { setSaving(false); }
  }

  async function resend(orderId: number) {
    setSaving(true); setMessage('');
    try { const response = await fetch(`/api/admin/orders/${orderId}/resend`, { method: 'POST' }); const data = await readJson<{ ok?: boolean; delivery?: { error?: string }; error?: string }>(response); if (!response.ok) throw new Error(apiError(data, 'Không thể gửi lại email.')); setMessage(data.ok ? 'Đã gửi lại link tải.' : data.delivery?.error || 'Email chưa gửi được.'); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể gửi lại email.'); }
    finally { setSaving(false); }
  }

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/'); }

  return <div className="min-h-screen bg-[#f5f6fb] text-[#17172a]"><header className="border-b border-[#e1e2eb] bg-white"><div className="mx-auto flex h-17 max-w-7xl items-center gap-3 px-4 sm:px-6"><Link href="/" className="flex items-center gap-2 font-extrabold"><span className="grid size-9 place-items-center rounded-xl bg-[#4635f3] text-white"><FileSpreadsheet className="size-5" /></span>KẺ ĐẾM TIỀN</Link><span className="rounded-full bg-[#ece9ff] px-2.5 py-1 text-xs font-semibold text-[#4635f3]">ADMIN</span><div className="ml-auto flex gap-2"><Button onClick={() => load()} variant="outline" size="icon" aria-label="Làm mới"><RefreshCcw /></Button><Button onClick={logout} variant="ghost"><LogOut />Đăng xuất</Button></div></div></header><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#4635f3]">Vận hành cửa hàng</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">Trang quản trị</h1></div><div className="flex rounded-xl bg-white p-1 ring-1 ring-[#dedfe8]"><button onClick={() => setTab('products')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'products' ? 'bg-[#4635f3] text-white' : 'text-[#6e6f82]'}`}>Sản phẩm ({products.length})</button><button onClick={() => setTab('orders')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'orders' ? 'bg-[#4635f3] text-white' : 'text-[#6e6f82]'}`}>Đơn hàng ({orders.length})</button></div></div>{message && <p className="mt-5 rounded-xl border border-[#dcd8ff] bg-[#f0eeff] px-4 py-3 text-sm text-[#4f3fc1]">{message}</p>}{loading && <div className="mt-12 flex justify-center text-[#737487]"><Loader2 className="mr-2 animate-spin" />Đang tải...</div>}
    {!loading && tab === 'products' && <div className="mt-7 grid gap-6 xl:grid-cols-[400px_1fr]"><form onSubmit={createProduct} className="h-fit rounded-3xl bg-white p-6 ring-1 ring-[#dfe0e9]"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#ece9ff] text-[#4635f3]"><PackagePlus /></span><div><h2 className="font-bold">Thêm sản phẩm</h2><p className="text-xs text-[#7a7b8d]">Một file XLSX và tối đa 6 ảnh preview</p></div></div><div className="mt-6 grid gap-4"><Field label="Tên sản phẩm"><Input name="title" required minLength={3} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Danh mục"><Input name="category" required placeholder="Tài chính cá nhân" /></Field><Field label="Giá VND"><Input name="priceVnd" type="number" min="0" step="1000" defaultValue="0" required /></Field></div><Field label="Mô tả ngắn"><Textarea name="shortDescription" required minLength={10} rows={2} /></Field><Field label="Mô tả đầy đủ"><Textarea name="description" required minLength={20} rows={5} /></Field><Field label="Ghi chú giấy phép"><Input name="licenseNote" required defaultValue="Giấy phép sử dụng tiêu chuẩn" /></Field><div className="grid grid-cols-2 gap-3"><Field label="File .xlsx"><Input name="file" type="file" accept=".xlsx" required /></Field><Field label="Ảnh preview"><Input name="images" type="file" accept="image/png,image/jpeg,image/webp" multiple required /></Field></div><Field label="Trạng thái"><select name="status" defaultValue="draft" className="h-10 w-full rounded-lg border border-[#dedfe8] bg-white px-3 text-sm"><option value="draft">Bản nháp</option><option value="published">Xuất bản</option></select></Field><Button disabled={saving} type="submit" className="h-11 bg-[#4635f3]">{saving && <Loader2 className="animate-spin" />}Upload sản phẩm</Button></div></form>
      <section><h2 className="text-lg font-bold">Danh sách sản phẩm</h2>{!products.length ? <div className="mt-4 rounded-2xl border border-dashed border-[#d6d7e1] bg-white p-10 text-center text-sm text-[#77788a]">Chưa có sản phẩm thật. Hãy upload sản phẩm đầu tiên.</div> : <div className="mt-4 grid gap-3">{products.map((product) => <article key={product.id} className="rounded-2xl bg-white p-5 ring-1 ring-[#e0e1e9]"><div className="flex flex-wrap items-start gap-4"><div className="grid size-14 place-items-center rounded-xl bg-[#ece9ff] font-bold text-[#4635f3]">XLSX</div><div className="min-w-0 flex-1"><input defaultValue={product.title} onBlur={(event) => event.target.value !== product.title && updateProduct(product, { title: event.target.value })} className="w-full rounded-md border-0 bg-transparent p-0 font-semibold outline-none focus:ring-2 focus:ring-[#bdb5ff]" /><p className="mt-1 text-xs text-[#797a8c]">/{product.slug} • {product.category} • v{product.version ?? 1}</p><div className="mt-3 flex flex-wrap items-center gap-2"><Input defaultValue={product.priceVnd} onBlur={(event) => Number(event.target.value) !== product.priceVnd && updateProduct(product, { priceVnd: Number(event.target.value) })} type="number" className="h-8 w-32" /><select value={product.status} onChange={(event) => updateProduct(product, { status: event.target.value as ProductStatus })} className="h-8 rounded-lg border border-[#dedfe8] bg-white px-2 text-xs"><option value="draft">Bản nháp</option><option value="published">Đang bán</option><option value="archived">Đã ẩn</option></select><label className="cursor-pointer rounded-lg border border-[#dedfe8] px-3 py-1.5 text-xs font-semibold hover:bg-[#f7f8fc]">Thay file<input type="file" accept=".xlsx" className="hidden" onChange={(event) => replaceAsset(product.id, event.target.files?.[0] ?? null)} /></label><Link href={`/san-pham/${product.slug}`} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#4635f3]">Xem trang</Link></div></div><p className="text-sm font-bold text-[#4635f3]">{formatVnd(product.priceVnd)}</p></div></article>)}</div>}</section></div>}
    {!loading && tab === 'orders' && <section className="mt-7"><div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-[#e0e1e9]"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-[#e5e6ed] bg-[#fafafe] text-xs uppercase tracking-wide text-[#767789]"><tr><th className="p-4">Đơn</th><th className="p-4">Khách</th><th className="p-4">Sản phẩm</th><th className="p-4">Tổng</th><th className="p-4">Trạng thái</th><th className="p-4">Giao file</th><th className="p-4"><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-[#eeeef3] last:border-0"><td className="p-4 font-semibold">#{order.order_code}</td><td className="p-4">{order.email}</td><td className="max-w-xs p-4 text-[#6e6f81]">{order.items}</td><td className="p-4 font-semibold">{formatVnd(order.amount_total)}</td><td className="p-4">{order.status}</td><td className="p-4"><span className={order.delivery_status === 'sent' ? 'text-[#078268]' : order.delivery_status === 'failed' ? 'text-red-600' : 'text-[#8a6a16]'}>{order.delivery_status}</span></td><td className="p-4">{order.status === 'paid' && <Button disabled={saving} onClick={() => resend(order.id)} variant="outline" size="sm"><Send />Gửi lại</Button>}</td></tr>)}</tbody></table>{!orders.length && <div className="p-12 text-center text-sm text-[#77788a]"><ShoppingBag className="mx-auto mb-3 size-8" />Chưa có đơn hàng.</div>}</div></section>}
  </main></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-semibold">{label}{children}</label>; }
