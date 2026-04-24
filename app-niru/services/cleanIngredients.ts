const WORDS_TO_REMOVE = [
  'food', 'dish', 'meal', 'cuisine', 'table', 'ingredient',
  'recipe', 'cooking', 'kitchen', 'produce', 'natural foods',
  'whole food', 'superfood', 'staple food', 'plant', 'leaf'
]

export function cleanIngredients(labels: string[]): string {
  const cleaned = labels
    .map(label => label.toLowerCase().trim())
    .filter(label => !WORDS_TO_REMOVE.includes(label))
    .filter(label => label.length > 0)

  const unique = [...new Set(cleaned)]
  return unique.slice(0, 8).join(',')
}