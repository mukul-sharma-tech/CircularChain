import ListingDetailsClient from "@/components/ListingDetailsClient";

export default function ListingPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  // Expect slug of form name-id
  const parts = slug.split("-");
  const idPart = parts[parts.length - 1];
  const listingId = Number(idPart);

  if (!listingId || isNaN(listingId)) {
    return <div>Invalid listing URL</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-[#0a0a1a] via-[#101020] to-[#1a1a2e] text-white">
      <ListingDetailsClient listingId={listingId} />
    </div>
  );
}
