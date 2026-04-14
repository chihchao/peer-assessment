import Link from 'next/link'
import { requireAuth } from '@/utils/auth'
import { getPendingReviews } from '@/app/actions/submissions'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function PeerReviewPage() {
  const { navUser } = await requireAuth()
  const reviews = await getPendingReviews()

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="互評任務" subtitle="待完成的互評列表" />

        {reviews.length === 0 ? (
          <p className="text-foreground/60">目前沒有待完成的互評任務。</p>
        ) : (
          <div className="grid gap-3">
            {reviews.map(r => (
              <Card key={r.id} className="hover:border-primary transition-colors">
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-foreground/50 mb-0.5">
                        {(r.assignments as { courses?: { name: string } | null } | null)?.courses?.name ?? ''}
                      </p>
                      <CardTitle className="text-sm font-medium">
                        {r.assignments?.title ?? '作業'}
                      </CardTitle>
                      <p className="text-xs text-foreground/50 mt-0.5">
                        量表：{r.assignments?.scale_min} – {r.assignments?.scale_max}
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/peer-review/${r.id}`}>開始互評</Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </PageWrapper>
    </>
  )
}
