export function formatFocRule(rule?: string): string {
  if (!rule) return 'Not set'
  const [paid, free] = rule.split('+')
  if (!paid || !free) return rule
  return `${paid} paid, ${free} free`
}
