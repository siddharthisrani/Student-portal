export type QuestionStatus =
  | "notVisited"
  | "visited"
  | "answered"
  | "review"
  | "current";

export function getQuestionStatus(
  index: number,
  current: number,
  visited: number[],
  reviews: number[],
  answers: Record<string, any>,
  questionId: string
): QuestionStatus {

  if (current === index)
    return "current";

  if (reviews.includes(index))
    return "review";

  if (answers[questionId])
    return "answered";

  if (visited.includes(index))
    return "visited";

  return "notVisited";
}