import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Mail, MapPin, Globe, MessageSquare, Lock, Eye, EyeOff, Save, LogOut } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    location: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    seekingLanguage: "",
    offeredLanguage: "",
    commonInterests: [] as string[],
  });

  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");

  // Cloudinary configuration
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dz3wmydp0";
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "language-app-profiles";

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token'); // Or however you store auth token
      console.log(' Token from localStorage:', token);
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:4000/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      
      // Set form data from database
      setFormData({
        name: data.name || "",
        username: data.username || "",
        email: data.email || "",
        location: data.location || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        seekingLanguage: data.seeking_language || "",
        offeredLanguage: data.offering_language || "",
        commonInterests: data.interests || [],
      });

      setInterests(data.interests || []);

      // Set profile image if exists
      if (data.profile_image_public_id) {
        const imageUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_800,c_limit,q_auto,f_auto/${data.profile_image_public_id}`;
        setProfileImage(imageUrl);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      alert('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('File too large. Max 5MB.');
    return;
  }

  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    alert('Invalid file type. Use JPG, PNG, WebP, or GIF.');
    return;
  }

  try {
    setIsUploading(true);

    // Create FormData to send file to backend
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');

    // Send to backend
    const response = await fetch('http://localhost:4000/api/upload/profile-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - browser will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    
    // Show uploaded image
    setProfileImage(data.imageUrl);

    alert('Profile image updated successfully!');
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload image. Please try again.');
  } finally {
    setIsUploading(false);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:4000/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          location: formData.location,
          offering_language: formData.offeredLanguage,
          seeking_language: formData.seekingLanguage,
          interests: interests,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      localStorage.removeItem('token');
      console.log("User logged out. Clearing session...");
      navigate('/');
    }
  };
  
  const handleForgotPassword = () => {
    alert("Password reset link sent to your email!");
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8">Settings</h1>

        {/* Profile Photo Section */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Photo</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
              </div>
              <label
                htmlFor="profile-upload"
                className={`absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition-all ${
                  isUploading 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isUploading ? (
                  <div className="animate-spin">⏳</div>
                ) : (
                  <Camera size={20} />
                )}
              </label>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Upload a new profile picture</p>
              <p className="text-gray-500 text-xs">JPG, PNG, WebP or GIF. Max size 5MB</p>
              {isUploading && <p className="text-purple-400 text-xs mt-2">Uploading...</p>}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                title="Email cannot be changed"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                <MapPin size={16} /> Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                placeholder="e.g., New York, USA"
              />
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe size={24} /> Languages
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Seeking Language</label>
              <input
                type="text"
                name="seekingLanguage"
                value={formData.seekingLanguage}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                placeholder="e.g., Spanish"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Offered Language</label>
              <input
                type="text"
                name="offeredLanguage"
                value={formData.offeredLanguage}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                placeholder="e.g., English"
              />
            </div>
          </div>
        </div>

        {/* Common Interests */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare size={24} /> Common Interests
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={handleInterestKeyDown}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
              placeholder="Add an interest..."
            />
            <button
              onClick={addInterest}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {interests.length > 0 ? (
              interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="bg-gray-900 border border-gray-700 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No interests added yet</p>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lock size={24} /> Change Password
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button
              onClick={handleForgotPassword}
              className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-700">
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Save Changes
          </button>
          <button
            onClick={() => fetchUserData()}
            className="sm:w-32 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="sm:w-32 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;