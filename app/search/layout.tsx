import Footer from "components/layout/footer";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-4 text-black dark:text-white">
        {children}
      </div>
      <Footer />
    </>
  );
}
