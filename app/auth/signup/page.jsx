import SignUpForm from "../../components/auth/SignUpForm";
import Link from "next/link";

/**
 * Sign Up page
 * Follows project standards for authentication implementation
 */
export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignUpForm />
        </div>
        <div className="text-center mt-4">
          <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
            Return to home
          </Link>
        </div>
      </div>
    </div>
  );
}
