type Props = {
  code: string
  onClose: () => void
}

export function ShareInviteModal({ code, onClose }: Props) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal share-modal"
        role="dialog"
        aria-labelledby="share-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" aria-hidden />
        <h2 id="share-title">I-send sa asawa mo</h2>
        <p className="lead compact">
          Ito ang inyong shared budget code. Ilagay niya ito sa kanyang phone
          sa “May code na ako”.
        </p>
        <div className="invite-code-display">{code}</div>
        <button
          type="button"
          className="btn primary full"
          onClick={() => navigator.clipboard.writeText(code)}
        >
          Kopyahin ang code
        </button>
        <button type="button" className="btn ghost full" onClick={onClose}>
          Sige, naintindihan ko
        </button>
      </div>
    </div>
  )
}
