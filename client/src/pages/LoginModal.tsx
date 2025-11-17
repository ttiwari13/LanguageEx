import { useState } from 'react';
import { X, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";

// Define the theme color for easy reference
const PRIMARY_COLOR = '#8B9D7C'; 

interface FormData {
  username: string;
  password: string;
}

interface Errors {
  username: string;
  password: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupClick: () => void;
}

export default function LoginModal({ isOpen, onClose, onSignupClick }: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: ''
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Errors>({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  // --- Handlers (Unchanged from the improved version) ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateLoginForm = () => {
    const newErrors: Partial<Errors> = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleLoginSubmit = async () => {
    const newErrors = validateLoginForm();
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:4000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: formData.username, password: formData.password }),
        });
        const data = await response.json();
        if (response.ok) {
          alert("Login successful!");
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          navigate("/dashboard");
          onClose();
        } else {
          alert(`Login failed: ${data.message || 'Invalid credentials'}`);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again later.");
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors as Errors);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    if (!forgotPasswordEmail.trim()) {
      alert('Please enter your username or email address.');
      return;
    }
    setLoading(true);
    try {
      // **Simulated API Call for Forgot Password**
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Sending reset link to:', forgotPasswordEmail);
      alert(`If an account with ${forgotPasswordEmail} exists, a password reset link has been sent.`);
      setIsForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error) {
      alert('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isForgotPassword) {
        handleForgotPasswordSubmit();
      } else {
        handleLoginSubmit();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 scale-100 ease-out">
        
        {/* Header Section (Themed) */}
        <div style={{ backgroundColor: PRIMARY_COLOR }} className="p-6 relative text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white hover:bg-black/10 rounded-full p-2 transition-all"
          >
            <X size={24} />
          </button>
          <div className="flex flex-col items-center text-center">
            <Lock size={30} className="mb-2" />
            <h2 className="text-3xl font-extrabold">
              {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
            </h2>
          </div>
          <p className="text-sm text-white/80 text-center mt-2">
            {isForgotPassword ? 'Enter your email or username to get a reset link' : 'Login to your language exchange account'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">

          {isForgotPassword ? (
            // --- Forgot Password Form ---
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="forgotPasswordEmail"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  // FIX: Use arbitrary value for ring color
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B9D7C] focus:border-transparent outline-none transition-all`}
                  placeholder="Enter your username or email"
                />
              </div>
            </div>
          ) : (
            // --- Login Form ---
            <>
              {/* Username Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    // FIX: Use arbitrary value for ring color
                    className={`w-full pl-10 pr-4 py-3 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#8B9D7C] focus:border-transparent outline-none transition-all`}
                    placeholder="Enter your username"
                  />
                </div>
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    // FIX: Use arbitrary value for ring color
                    className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#8B9D7C] focus:border-transparent outline-none transition-all`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Remember Me & Forgot Password Links */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    // Removed dynamic styling, using Tailwind's default primary color for simplicity/compatibility
                    className="mr-2 w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <span
                  onClick={() => setIsForgotPassword(true)}
                  className="font-semibold hover:underline cursor-pointer"
                  style={{color: PRIMARY_COLOR}} // Themed color
                >
                  Forgot password?
                </span>
              </div>
            </>
          )}

          {/* Submit Button (Themed) */}
          <button
            onClick={isForgotPassword ? handleForgotPasswordSubmit : handleLoginSubmit}
            disabled={loading}
            className="w-full text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transform transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{backgroundColor: PRIMARY_COLOR}} // Themed color
          >
            {loading ? (
              <>
                <Loader2 className='animate-spin' size={20} />
                <span>{isForgotPassword ? 'Sending Link...' : 'Logging in...'}</span>
              </>
            ) : (
              isForgotPassword ? 'Send Reset Link' : 'Login'
            )}
          </button>
          
          {/* Footer Navigation (Themed) */}
          <p className="text-center text-gray-600 text-sm mt-4">
            {isForgotPassword ? (
                <>
                    Remember your password?{' '}
                    <span 
                      onClick={() => setIsForgotPassword(false)}
                      className="font-semibold hover:underline cursor-pointer"
                      style={{color: PRIMARY_COLOR}} // Themed color
                    >
                      Back to Login
                    </span>
                </>
            ) : (
                <>
                    Don't have an account?{' '}
                    <span 
                      onClick={onSignupClick}
                      className="font-semibold hover:underline cursor-pointer"
                      style={{color: PRIMARY_COLOR}} // Themed color
                    >
                      Sign Up
                    </span>
                </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}