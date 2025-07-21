interface CreateAccountProp {
  signUp: () => void;
  error?: Error;
}

export default function CreateAccount({ signUp, error }: CreateAccountProp) {
  return (
    <div className="mt-4 px-8">
      <div className="wrapper">
        {error && (
          <div className="alert alert--error">
            <p>{error.message}</p>
          </div>
        )}
        <h1 className="text-white/90 text-2xl text-center">OOPs?</h1>
        <div className="text-white/70 mt-3 text-lg font-light px-4 text-center">
          Seems Like you doesn&apos;t have account associated with the provided
          credentials. Please create an account to continue.
        </div>
        <div className="mt-8">
          <button
            onClick={signUp}
            className={`w-full h-12 rounded-xl font-medium transition-all mt-5 cursor-pointer text-base ${"bg-white/95 text-black hover:bg-gray-100"}`}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
