export default function Loading() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-[1560px] animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-7 w-40 rounded-lg bg-[#ececf4]" />
      <div className="mt-4 h-12 max-w-2xl rounded-xl bg-[#ececf4]" />
      <div className="mt-3 h-5 max-w-xl rounded-lg bg-[#f1f1f6]" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-56 rounded-3xl border border-[#e7e8f1] bg-[#f7f7fb]"
          />
        ))}
      </div>
      <span className="sr-only">Đang tải nội dung…</span>
    </main>
  );
}
