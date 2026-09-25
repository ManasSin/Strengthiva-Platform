const ErrorMessage = ({ error, 'data-testid': dataTestid }: { error?: string | null, 'data-testid'?: string }) => {
  if (!error) {
    return null
  }

  return (
    <div className="field-error" style={{ paddingTop: 8 }} data-testid={dataTestid}>
      <span>{error}</span>
    </div>
  )
}

export default ErrorMessage
