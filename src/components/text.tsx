interface ITextProps {
  children: string
}

export function Text({ children }: ITextProps) {
  return children
    .split('\n')
    .map((line, i) => (
      <p key={i}>{line}</p>
    ))
}
