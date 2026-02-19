import Link from "next/link";
import { ChevronBreadcrumb } from "@/components/icons/ChevronBreadcrumb";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} />;
}

export default function ActivityDetailLoading() {
  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Link
            href=".."
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Activity
          </Link>
          <ChevronBreadcrumb size={14} className="text-gray-500 shrink-0" />
          <Skeleton className="h-4 w-20" />
        </div>
      </PageHeader>

      <div className="p-6">
        <div className="flex gap-6">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            <SectionCard title="Summary" className="mb-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="ml-auto">
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Related Activity" flush>
              <div className="px-4 py-3 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Right column */}
          <div className="w-80 shrink-0 space-y-6 hidden lg:block">
            <SectionCard title="Customer">
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Subscription">
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Actions">
              <div className="space-y-2">
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </>
  );
}
