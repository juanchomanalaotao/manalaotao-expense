import '../App.css'

type Props = {
  message?: string
}

export function LoadingScreen({ message = 'Kumokonekta…' }: Props) {
  return (
    <div className="app-page">
      <div className="app-bg" aria-hidden />
      <div className="loading-screen">
        <div className="loading-spinner" aria-hidden />
        <p>{message}</p>
      </div>
    </div>
  )
}
