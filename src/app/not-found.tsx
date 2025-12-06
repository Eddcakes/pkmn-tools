import { Link } from "@/components";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <Link href="/" variant="button" className="inline-block">
          Go Home
        </Link>
      </div>
    </div>
  );
}
