type AuthView = "default" | "email" | "phone" | "wallet" | "webauthn";
interface AuthMethodsProps {
  setView: React.Dispatch<React.SetStateAction<AuthView>>;
  isSignup?: boolean;
}

const AuthMethods = ({ setView, isSignup }: AuthMethodsProps) => {
  return (
    <>
      <div className="bg-white/90 p-1.5 w-[90%] ml-auto mr-auto mt-9 h-12 rounded-xl mb-4">
        <button
          type="button"
          className="btn btn--outline flex justify-between items-center w-full"
          onClick={() => setView("email")}
        >
          <div className="btn__icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <span className=" text-black ml-auto font-light mr-2 text-md">
            {isSignup ? "Create account" : "Continue"} with Email
          </span>
        </button>
      </div>
    </>
  );
};

export default AuthMethods;
