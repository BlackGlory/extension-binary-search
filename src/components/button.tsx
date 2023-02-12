export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full border py-1.5 px-4 hover:bg-gray-300 ${props.className ?? ''}`}
    />
  )
}
