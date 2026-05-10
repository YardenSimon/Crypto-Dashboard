import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useCurrentUser } from '@/features/auth/hooks'
import { Button } from '@/components/ui/button'
import { QuizSection } from '@/features/onboarding/QuizSection'
import {
  quizSchema,
  type QuizFormValues,
  COINS,
  INVESTOR_TYPES,
  CONTENT_TYPES,
} from '@/features/onboarding/quizSchema'

export function PreferencesPage() {
  const { data: user, isLoading: userLoading, isError: userError } = useCurrentUser()
  const { data: prefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: api.getPreferences,
    enabled: !!user?.onboarding_completed,
  })
  const [saved, setSaved] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: { coins: [], investor_types: [], content_types: [] },
  })

  useEffect(() => {
    if (prefs) reset({
      coins: prefs.coins as QuizFormValues['coins'],
      investor_types: prefs.investor_types as QuizFormValues['investor_types'],
      content_types: prefs.content_types.filter(
        (ct): ct is QuizFormValues['content_types'][number] => (CONTENT_TYPES as readonly string[]).includes(ct)
      ),
    })
  }, [prefs, reset])

  const mutation = useMutation({
    mutationFn: api.putPreferences,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['preferences'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setSaved(true)
    },
  })

  if (userLoading || prefsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading…</span>
      </div>
    )
  }
  if (userError || !user) return <Navigate to="/login" replace />
  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />

  function onSubmit(values: QuizFormValues) {
    setSaved(false)
    mutation.mutate({ ...values, dashboard_layout: prefs?.dashboard_layout ?? null, coin_order: prefs?.coin_order ?? null })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">Your preferences</h1>
        <p className="mb-8 text-muted-foreground">Update what you see on your dashboard.</p>

        {saved && (
          <div className="mb-6 rounded-xl border border-teal/25 bg-teal/[0.07] px-4 py-3 text-sm text-teal">
            Preferences saved — your dashboard will refresh with the new settings.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <Controller
            control={control}
            name="coins"
            render={({ field }) => (
              <QuizSection
                label="Which coins do you follow?"
                helperText="Pick at least one"
                options={COINS}
                value={field.value}
                onChange={(v) => { setSaved(false); field.onChange(v) }}
                error={errors.coins?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="investor_types"
            render={({ field }) => (
              <QuizSection
                label="What kind of investor are you?"
                helperText="Pick 1–2"
                options={INVESTOR_TYPES}
                value={field.value}
                onChange={(v) => { setSaved(false); field.onChange(v) }}
                error={errors.investor_types?.message}
                maxSelections={2}
              />
            )}
          />
          <Controller
            control={control}
            name="content_types"
            render={({ field }) => (
              <QuizSection
                label="What content do you want to see?"
                helperText="Pick at least one"
                options={CONTENT_TYPES}
                value={field.value}
                onChange={(v) => { setSaved(false); field.onChange(v) }}
                error={errors.content_types?.message}
              />
            )}
          />

          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
          )}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </span>
            ) : (
              'Save changes'
            )}
          </Button>

          <Link
            to="/dashboard"
            className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-full border border-line2 py-2.5 text-sm font-medium text-subt hover:text-ink hover:border-line transition-colors"
          >
            ← Go back to Dashboard
          </Link>
        </form>
      </main>
    </div>
  )
}
