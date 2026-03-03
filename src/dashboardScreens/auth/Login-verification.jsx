import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import loginImage from "../../assets/login.png";
import Logo from "../../assets/logo.svg";
import { authService } from "../../services/auth.service";
import { checkAuth } from "../../store/slices/authSlice";
import { getRoleBasedRoute } from "../../utils/roleRouting";

const LoginVerification = () => {
  const inputsRef = useRef([]);
  const [counter, setCounter] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userId, phone } = location.state || {};

  useEffect(() => {
    if (counter === 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCounter((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [counter]);

  useEffect(() => {
    if (!userId) {
      // No pending 2FA session – go back to login
      navigate("/login", { replace: true });
    }
  }, [userId, navigate]);

  const handleResend = () => {
    setCounter(60);
    setCanResend(false);
    inputsRef.current.forEach((input) => {
      if (input) input.value = "";
    });
    inputsRef.current = [];
    setError("");
    // In a real app, we'd call a /auth/resend-2fa endpoint here.
    console.log("Resend code requested");
  };

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/^\d$/.test(value)) {
      if (index < 5) {
        inputsRef.current[index + 1].focus();
      }
    } else if (value === "") {
    } else {
      e.target.value = "";
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const otp = inputsRef.current.map((input) => input.value).join("");
    if (otp.length < 4) {
      setError("Please enter the full verification code.");
      return;
    }
    try {
      const data = await authService.verifyTwoFactor(userId, otp);
      await dispatch(checkAuth());
      const route = getRoleBasedRoute(data?.role);
      navigate(route || "/", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Verification failed. Please check the code and try again."
      );
    }
  };

  return (
    <div
      className="w-full min-h-screen flex bg-cover bg-center"
      style={{
        backgroundImage: `
        linear-gradient(
          to right, 
          rgba(37, 99, 235, 0.6),
          rgba(134, 239, 172, 0.3),
          rgba(74, 222, 128, 0)
        ),
        url(${loginImage})
      `,
      }}
    >
      <div className="lg:w-[80%] w-[90%] mx-auto">
        <div className="lg:w-[43%] md:w-[55%]">
          <div className="flex justify-center items-center my-10">
            <img src={Logo} width={300} height={300} />
          </div>

          <div
            className="bg-white bg-opacity-90 rounded-2xl px-8  sm:py-15 py-11 w-full "
            style={{ boxShadow: "inset 0 0px 4px rgba(0, 0, 0, 0.6)" }}
          >
            <div className="text-center sm:mb-10 mb-4">
              <h2 className="text-2xl font-semibold text-center">
                Verify Your Identity
              </h2>
              <p className="text-[#0060A9]  sm:text-sm text-[12px]">
                Enter the verification code sent to your phone
              </p>
              {phone && (
                <p className="text-xs text-[#337FBA] mt-1">
                  Code sent to: <span className="font-semibold">{phone}</span>
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
                {error}
              </div>
            )}

            <form className="sm:space-y-10 space-y-8" onSubmit={handleSubmit}>
              <div className="flex justify-center xl:space-x-5 md:space-x-2  space-x-1 sm:my-10 my-8">
                {[...Array(6)].map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength="1"
                    ref={(el) => (inputsRef.current[i] = el)}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className="sm:w-12 sm:h-12 w-9 h-9 text-center rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    style={{
                      boxShadow: "inset 0px 3px 5px rgba(0, 0, 0, 0.15)",
                    }}
                  />
                ))}
              </div>

              <div className="text-center text-xs md:flex justify-center">
                Didn’t receive a code?{" "}
                {!canResend ? (
                  <p className="">
                    <span className="text-[#0060A9]">
                      Resend code after {counter} second
                      {counter !== 1 ? "s" : ""}
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[#0060A9] underline text-xs"
                  >
                    Resend code
                  </button>
                )}
              </div>

              <button type="submit" className="custom-shadow-button my-3">
                Submit code
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginVerification;
