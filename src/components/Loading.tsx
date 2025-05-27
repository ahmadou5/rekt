interface LoadingProps {
  copy: string;
  error?: Error;
}

export default function Loading({ copy, error }: LoadingProps) {
  return (
    <div className="container">
      <div className="wrapper">
        {error && (
          <div className="alert alert--error">
            <p className="text-white/70">{error.message}</p>
          </div>
        )}
        <div className="loader-container">
          <div className="loader"></div>
          <p className="text-white/70">{copy}</p>
        </div>
      </div>
    </div>
  );
}
