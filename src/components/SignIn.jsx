import { useAuth } from "../authContext";
import { signInWithGoogle, signInWithEmail } from "../firebase";
import { useState, useEffect } from "react";
import { User, Lock, Mail, ArrowRightCircle } from "lucide-react";

export default function SignIn() {
  const [mode, setMode] = useState("login");
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) window.location.href = "/";
  }, [user]);

  async function onSubmit(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const pwd = e.target.password.value;
    try {
      if (mode === "signup") {
        await import("../firebase").then((m) => m.signUpWithEmail(email, pwd));
      } else {
        await signInWithEmail(email, pwd);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 bg-gradient-to-tl from-[#1a1c2b] via-[#23263a] to-[#2d3250]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          {mode === "signup" ? "Create Account" : "Welcome Back"}
        </h2>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center py-2 mb-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
            className="w-5 h-5 mr-2"
          />
          Continue with Google
        </button>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="px-2 text-gray-500">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
          >
            {mode === "signup" ? "Sign up" : "Log in"}
            <ArrowRightCircle className="ml-2 w-5 h-5" />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button
            onClick={() =>
              setMode((m) => (m === "signup" ? "login" : "signup"))
            }
            className="text-indigo-600 font-medium hover:underline"
          >
            {mode === "signup" ? "Log in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
