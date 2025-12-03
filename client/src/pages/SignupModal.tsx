import { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Globe, MessageSquare } from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface FormData {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  seekingLanguage: string;
  offeringLanguage: string;
}

interface Errors {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  seekingLanguage: string;
  offeringLanguage: string;
}

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

export default function SignupModal({ isOpen, onClose, onLoginClick }: SignupModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    seekingLanguage: '',
    offeringLanguage: ''
  });
  const [errors, setErrors] = useState<Errors>({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    seekingLanguage: '',
    offeringLanguage: ''
  });

  const languages = [
    'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Assamese',
    'Azerbaijani', 'Basque', 'Belarusian', 'Bengali', 'Bosnian', 'Bulgarian',
    'Burmese', 'Catalan', 'Cebuano', 'Chinese (Cantonese)', 'Chinese (Mandarin)',
    'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Esperanto', 'Estonian',
    'Filipino', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek',
    'Gujarati', 'Haitian Creole', 'Hausa', 'Hebrew', 'Hindi', 'Hmong',
    'Hungarian', 'Icelandic', 'Igbo', 'Indonesian', 'Irish', 'Italian',
    'Japanese', 'Javanese', 'Kannada', 'Kazakh', 'Khmer', 'Korean', 'Kurdish',
    'Lao', 'Latin', 'Latvian', 'Lithuanian', 'Macedonian', 'Malagasy',
    'Malay', 'Malayalam', 'Maltese', 'Maori', 'Marathi', 'Mongolian',
    'Nepali', 'Norwegian', 'Odia', 'Pashto', 'Persian', 'Polish',
    'Portuguese', 'Punjabi', 'Romanian', 'Russian', 'Samoan', 'Serbian',
    'Shona', 'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali',
    'Spanish', 'Sundanese', 'Swahili', 'Swedish', 'Tajik', 'Tamil',
    'Tatar', 'Telugu', 'Thai', 'Turkish', 'Turkmen', 'Ukrainian',
    'Urdu', 'Uyghur', 'Uzbek', 'Vietnamese', 'Welsh', 'Xhosa',
    'Yiddish', 'Yoruba', 'Zulu'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Errors> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.seekingLanguage) {
      newErrors.seekingLanguage = 'Please select a seeking language';
    }

    if (!formData.offeringLanguage) {
      newErrors.offeringLanguage = 'Please select an offering language';
    }

    if (formData.seekingLanguage && formData.offeringLanguage && 
        formData.seekingLanguage === formData.offeringLanguage) {
      newErrors.seekingLanguage = 'Seeking and offering languages cannot be the same';
      newErrors.offeringLanguage = 'Seeking and offering languages cannot be the same';
    }
    
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/users/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            seekingLanguage: formData.seekingLanguage,
            offeringLanguage: formData.offeringLanguage,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          alert("Signup successful! 🎉");
          console.log("Backend response:", data);
          
          // Reset form data
          setFormData({
            name: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            seekingLanguage: '',
            offeringLanguage: ''
          });
          
          // Reset errors
          setErrors({
            name: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            seekingLanguage: '',
            offeringLanguage: ''
          });
          
          onClose();
          // Open login modal after successful signup
          setTimeout(() => {
            onLoginClick();
          }, 100);
        } else {
          alert(`Signup failed: ${data.message}`);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors as Errors);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto py-8 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#8B9D7C] to-[#97a88a] p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
          <h2 className="text-3xl font-bold text-white mb-2">Sign Up</h2>
          <p className="text-purple-100">Create your language exchange account</p>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="Enter your name"
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

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
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-3 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="Choose a username"
              />
            </div>
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="example@email.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
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
                disabled={isLoading}
                className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          
<div className="border-t pt-4 mt-4">
  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
    <Globe size={20} className="text-[#8B9D7C]" />
    Language Preferences
  </h3>

  <div>
    <label htmlFor="seekingLanguage" className="block text-sm font-medium text-gray-700 mb-2">
      <MessageSquare size={16} className="inline mr-1" />
      Seeking Language
    </label>
    <select
      id="seekingLanguage"
      name="seekingLanguage"
      value={formData.seekingLanguage}
      onChange={handleChange}
      disabled={isLoading}
      className={`w-full px-4 py-3 border ${errors.seekingLanguage ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed`}
    >
      <option value="">Select a language</option>
      {languages.map(lang => (
        <option key={lang} value={lang}>{lang}</option>
      ))}
    </select>
    {errors.seekingLanguage && <p className="text-red-500 text-sm mt-1">{errors.seekingLanguage}</p>}
  </div>

  <div className="mt-4">
    <label htmlFor="offeringLanguage" className="block text-sm font-medium text-gray-700 mb-2">
      <MessageSquare size={16} className="inline mr-1" />
      Offering Language
    </label>
    <select
      id="offeringLanguage"
      name="offeringLanguage"
      value={formData.offeringLanguage}
      onChange={handleChange}
      disabled={isLoading}
      className={`w-full px-4 py-3 border ${errors.offeringLanguage ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed`}
    >
      <option value="">Select a language</option>
      {languages.map(lang => (
        <option key={lang} value={lang}>{lang}</option>
      ))}
    </select>
    {errors.offeringLanguage && <p className="text-red-500 text-sm mt-1">{errors.offeringLanguage}</p>}
  </div>
</div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#8B9D7C] to-[#8B9D7C] text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing Up...
              </>
            ) : (
              'Sign Up'
            )}
          </button>

          <p className="text-center text-gray-600 text-sm">
            Already have an account?{' '}
            <span 
              onClick={isLoading ? undefined : onLoginClick}
              className={`text-[#8B9D7C] font-semibold hover:underline ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              Log In
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}