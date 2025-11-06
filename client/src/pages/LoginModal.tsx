import { useState } from 'react';
import { X, Lock, User, Eye, EyeOff } from 'lucide-react';

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
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<Errors>({
    username: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Errors> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch("http://localhost:4000/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          alert("Login successful!");
          console.log("Backend response:", data);
          // Store token if your backend sends one
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          onClose();
        } else {
          alert(`Login failed: ${data.message}`);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again later.");
      }
    } else {
      setErrors(newErrors as Errors);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <X size={24} />
          </button>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-purple-100">Login to your language exchange account</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className={`w-full pl-10 pr-4 py-3 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all`}
                placeholder="Enter your username"
              />
            </div>
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-gray-600">Remember me</span>
            </label>
            <span className="text-purple-600 font-semibold hover:underline cursor-pointer">
              Forgot password?
            </span>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 mt-6"
          >
            Login
          </button>

          <p className="text-center text-gray-600 text-sm">
            Don't have an account?{' '}
            <span 
              onClick={onSignupClick}
              className="text-purple-600 font-semibold hover:underline cursor-pointer"
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}