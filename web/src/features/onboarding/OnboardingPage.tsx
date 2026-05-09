import { Navigate, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useCurrentUser } from '@/features/auth/hooks'
import { Button } from '@/components/ui/button'
import { QuizSection } from './QuizSection'
import {
  quizSchema,
  type QuizFormValues,
  COINS,
  INVESTOR_TYPES,
  CONTENT_TYPES,
} from './quizSchema'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { data: user, isLoading, isError } = useCurrentUser()

  const mutation = useMutation({
    mutationFn: api.putPreferences,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate('/dashboard')
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: { coins: [], investor_types: [], content_types: [] },
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading…</span>
      </div>
    )
  }
  if (isError || !user) return <Navigate to="/login" replace />
  if (user.onboarding_completed) return <Navigate to="/dashboard" replace />

  function onSubmit(values: QuizFormValues) {
    mutation.mutate(values)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Tell us about yourself</h1>
      <p className="mb-8 text-muted-foreground">We'll use your answers to personalise your dashboard.</p>

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
              onChange={field.onChange}
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
              onChange={field.onChange}
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
              onChange={field.onChange}
              error={errors.content_types?.message}
            />
          )}
        />

        {mutation.isError && (
          <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          data-loading={mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving…
            </span>
          ) : (
            'Get my dashboard →'
          )}
        </Button>
      </form>
    </div>
  )
}
