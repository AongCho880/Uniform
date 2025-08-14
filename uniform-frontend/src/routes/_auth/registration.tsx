// uniform-frontend/src/routes/_auth/registration.tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { GraduationCap, Eye, EyeOff, Calendar, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { toast } from 'sonner'
import { registerUser } from '@/api'
import axios from 'axios'

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // If the cleaned string starts with '880', then we add a '+' at the beginning
  if (cleaned.startsWith('880')) {
    return `+${cleaned}`;
  }
  // If it starts with '0', then we replace the leading '0' with '+880'
  if (cleaned.startsWith('0')) {
    return `+880${cleaned.substring(1)}`;
  }
  // If it starts with '1' (assuming it's a local number without country code and without leading 0)
  if (cleaned.startsWith('1')) {
    return `+880${cleaned}`;
  }
  // If none of the above, return the original phone (or throw an error, but we'll just return as is)
  return phone;
}

// Validation function for Bangladeshi phone number
function validateBangladeshiPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if the cleaned number starts with 880 and has 13 digits in total
  if (cleaned.startsWith('880') && cleaned.length === 13) {
    return true;
  }

  // Check if the cleaned number starts with 0 and has 11 digits in total
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return true;
  }

  // Check if the cleaned number starts with 1 and has 10 digits in total (assuming it's a local number without country code and without leading 0)
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    return true;
  }

  return false;
}

// Validation function for GPA
function validateGPA(gpa: string): boolean {
  const gpaValue = parseFloat(gpa);
  return !isNaN(gpaValue) && gpaValue >= 0 && gpaValue <= 5;
}

// Validation function for year
function validateYear(year: string): boolean {
  const yearValue = parseInt(year);
  const currentYear = new Date().getFullYear();
  return !isNaN(yearValue) && yearValue >= 1990 && yearValue <= currentYear;
}

export const Route = createFileRoute('/_auth/registration')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    dob: '',
    medium: '',
    examPath: '',
    // SSC Details
    sscRoll: '',
    sscRegistration: '',
    sscGpa: '',
    sscYear: '',
    sscBoard: '',
    // HSC Details
    hscRoll: '',
    hscRegistration: '',
    hscGpa: '',
    hscYear: '',
    hscBoard: '',
    // Dakhil Details
    dakhilRoll: '',
    dakhilRegistration: '',
    dakhilGpa: '',
    dakhilYear: '',
    dakhilBoard: '',
    // Alim Details
    alimRoll: '',
    alimRegistration: '',
    alimGpa: '',
    alimYear: '',
    alimBoard: '',
  })

  // Validate a single field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'userName':
        return value.trim() ? '' : 'Full name is required';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Please enter a valid email address';
      case 'phone':
        return validateBangladeshiPhoneNumber(value) ? '' : 'Please enter a valid Bangladeshi phone number (e.g., +8801712345678 or 01712345678)';
      case 'password':
        return value.length >= 6 ? '' : 'Password must be at least 6 characters';
      case 'confirmPassword':
        return value === formData.password ? '' : 'Passwords do not match';
      case 'address':
        return value.trim() ? '' : 'Address is required';
      case 'dob':
        return value ? '' : 'Date of birth is required';
      case 'medium':
        return value ? '' : 'Please select a medium';
      case 'examPath':
        return value ? '' : 'Please select an exam path';
      case 'sscRoll':
        return formData.examPath === 'NATIONAL' && !value.trim() ? 'SSC roll number is required' : '';
      case 'sscRegistration':
        return formData.examPath === 'NATIONAL' && !value.trim() ? 'SSC registration number is required' : '';
      case 'sscGpa':
        return formData.examPath === 'NATIONAL' && !validateGPA(value) ? 'Please enter a valid SSC GPA (0-5)' : '';
      case 'sscYear':
        return formData.examPath === 'NATIONAL' && !validateYear(value) ? 'Please enter a valid SSC year' : '';
      case 'sscBoard':
        return formData.examPath === 'NATIONAL' && !value ? 'Please select SSC board' : '';
      case 'hscRoll':
        return formData.examPath === 'NATIONAL' && !value.trim() ? 'HSC roll number is required' : '';
      case 'hscRegistration':
        return formData.examPath === 'NATIONAL' && !value.trim() ? 'HSC registration number is required' : '';
      case 'hscGpa':
        return formData.examPath === 'NATIONAL' && !validateGPA(value) ? 'Please enter a valid HSC GPA (0-5)' : '';
      case 'hscYear':
        return formData.examPath === 'NATIONAL' && !validateYear(value) ? 'Please enter a valid HSC year' : '';
      case 'hscBoard':
        return formData.examPath === 'NATIONAL' && !value ? 'Please select HSC board' : '';
      case 'dakhilRoll':
        return formData.examPath === 'MADRASHA' && !value.trim() ? 'Dakhil roll number is required' : '';
      case 'dakhilRegistration':
        return formData.examPath === 'MADRASHA' && !value.trim() ? 'Dakhil registration number is required' : '';
      case 'dakhilGpa':
        return formData.examPath === 'MADRASHA' && !validateGPA(value) ? 'Please enter a valid Dakhil GPA (0-5)' : '';
      case 'dakhilYear':
        return formData.examPath === 'MADRASHA' && !validateYear(value) ? 'Please enter a valid Dakhil year' : '';
      case 'dakhilBoard':
        return formData.examPath === 'MADRASHA' && !value ? 'Please select Dakhil board' : '';
      case 'alimRoll':
        return formData.examPath === 'MADRASHA' && !value.trim() ? 'Alim roll number is required' : '';
      case 'alimRegistration':
        return formData.examPath === 'MADRASHA' && !value.trim() ? 'Alim registration number is required' : '';
      case 'alimGpa':
        return formData.examPath === 'MADRASHA' && !validateGPA(value) ? 'Please enter a valid Alim GPA (0-5)' : '';
      case 'alimYear':
        return formData.examPath === 'MADRASHA' && !validateYear(value) ? 'Please enter a valid Alim year' : '';
      case 'alimBoard':
        return formData.examPath === 'MADRASHA' && !value ? 'Please select Alim board' : '';
      default:
        return '';
    }
  }

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate all form fields
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user selects an option
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate form
    if (!validateForm()) {
      toast.error("Validation Error", {
        description: "Please fix the errors in the form."
      });
      return;
    }
    
    console.log("formData---------: \n",formData);
    setIsLoading(true);
    
    try {
      // Format the phone number
      const formattedPhone = formatPhoneNumber(formData.phone);

      // Prepare user data for API
      const userData = {
        userName: formData.userName,
        email: formData.email,
        phone: formattedPhone, // Use formatted phone number
        password: formData.password,
        address: formData.address,
        role: "STUDENT",
        dob: formData.dob,
        examPath: formData.examPath,
        medium: formData.medium,
        // Include academic details based on examPath
        ...(formData.examPath === 'NATIONAL' && {
          sscRoll: formData.sscRoll,
          sscRegistration: formData.sscRegistration,
          sscGpa: formData.sscGpa,
          sscYear: formData.sscYear,
          sscBoard: formData.sscBoard,
          hscRoll: formData.hscRoll,
          hscRegistration: formData.hscRegistration,
          hscGpa: formData.hscGpa,
          hscYear: formData.hscYear,
          hscBoard: formData.hscBoard,
        }),
        ...(formData.examPath === 'MADRASHA' && {
          dakhilRoll: formData.dakhilRoll,
          dakhilRegistration: formData.dakhilRegistration,
          dakhilGpa: formData.dakhilGpa,
          dakhilYear: formData.dakhilYear,
          dakhilBoard: formData.dakhilBoard,
          alimRoll: formData.alimRoll,
          alimRegistration: formData.alimRegistration,
          alimGpa: formData.alimGpa,
          alimYear: formData.alimYear,
          alimBoard: formData.alimBoard,
        }),
      };

      // Call the register API
      const newUser = await registerUser(userData);

      if (newUser) {
        // Log the user in
        login(newUser);
        toast.success("Registration Successful", {
          description: "Your account has been created successfully."
        });
        // Navigate to dashboard
        navigate({ to: '/student/dashboard' });
      } else {
        toast.error("Registration Failed", {
          description: "There was a problem creating your account. Please try again."
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "There was a problem creating your account. Please try again.";

      // Check if error is an Axios error
      if (axios.isAxiosError(error)) {
        // Handle axios specific errors
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const responseData = error.response.data;

          if (status === 400) {
            // Handle validation errors
            if (responseData.errors) {
              // Extract the first validation error message
              const firstError = responseData.errors[0];
              errorMessage = firstError.message || "Invalid registration data. Please check your inputs.";

              // Show more specific error for phone number
              if (firstError.field === 'phone') {
                errorMessage = "Invalid phone number format. Please use a valid Bangladeshi phone number (e.g., +8801XXXXXXXXX).";
              }
            } else if (responseData.message) {
              errorMessage = responseData.message;
            }
          } else if (status === 409) {
            errorMessage = "An account with this email already exists.";
          }
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = "Network error. Please check your internet connection.";
        }
      } else if (error instanceof Error) {
        // Handle generic JavaScript errors
        errorMessage = error.message;
      }

      toast.error("Registration Failed", {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg">
        {/* Logo and Title Section */}
        <div className="text-center pt-8 pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gray-900 rounded-full">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Join UniForm</h2>
          <p className="mt-2 text-gray-600">Centralized University Admission System</p>
        </div>

        {/* Registration Form */}
        <div className="px-8 pb-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join thousands of students applying through UniForm</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName" className="text-gray-700 font-medium">
                Full Name
              </Label>
              <Input
                type="text"
                id="userName"
                name="userName"
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 border ${errors.userName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                value={formData.userName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={isLoading}
              />
              {errors.userName && touched.userName && (
                <p className="text-red-500 text-sm flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.userName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="username@domain.com"
                className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={isLoading}
              />
              {errors.email && touched.email && (
                <p className="text-red-500 text-sm flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Phone Number
              </Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                placeholder="+8801712345678"
                className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={isLoading}
              />
              {errors.phone && touched.phone && (
                <p className="text-red-500 text-sm flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.phone}
                </p>
              )}
              <p className="text-sm text-gray-500">Enter a valid Bangladeshi phone number (e.g., +8801712345678)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700 font-medium">
                Address
              </Label>
              <Input
                type="text"
                id="address"
                name="address"
                placeholder="Enter your address"
                className={`w-full px-4 py-3 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={isLoading}
              />
              {errors.address && touched.address && (
                <p className="text-red-500 text-sm flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.address}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob" className="text-gray-700 font-medium">
                Date of Birth
              </Label>
              <div className="relative">
                <Input
                  type="date"
                  id="dob"
                  name="dob"
                  className={`w-full px-4 py-3 border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                  value={formData.dob}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  disabled={isLoading}
                />
                <Calendar className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.dob && touched.dob && (
                <p className="text-red-500 text-sm flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.dob}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="examPath" className="text-gray-700 font-medium">
                Exam Path
              </Label>
              <Select
                value={formData.examPath}
                onValueChange={(value) => handleSelectChange('examPath', value)}
                disabled={isLoading}
              >
                <SelectTrigger className={`w-full ${errors.examPath ? 'border-red-500' : 'border-gray-300'}`}>
                  <SelectValue placeholder="Select exam path" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIONAL">National Curriculum (SSC/HSC)</SelectItem>
                  <SelectItem value="MADRASHA">Madrasha Curriculum (Dakhil/Alim)</SelectItem>
                </SelectContent>
              </Select>
              {errors.examPath && touched.examPath && (
                <p className="text-red-500 text-sm flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.examPath}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="medium" className="text-gray-700 font-medium">
                Medium
              </Label>
              <Select
                value={formData.medium}
                onValueChange={(value) => handleSelectChange('medium', value)}
                disabled={isLoading}
              >
                <SelectTrigger className={`w-full ${errors.medium ? 'border-red-500' : 'border-gray-300'}`}>
                  <SelectValue placeholder="Select medium" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bangla">Bangla</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                </SelectContent>
              </Select>
              {errors.medium && touched.medium && (
                <p className="text-red-500 text-sm flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.medium}
                </p>
              )}
            </div>

            {/* Conditional Academic Details Section */}
            {formData.examPath === 'NATIONAL' && (
              <>
                {/* SSC Details */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">SSC Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sscRoll" className="text-gray-700 font-medium">
                        Roll Number
                      </Label>
                      <Input
                        type="text"
                        id="sscRoll"
                        name="sscRoll"
                        placeholder="SSC Roll Number"
                        className={`w-full px-4 py-3 border ${errors.sscRoll ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.sscRoll}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.sscRoll && touched.sscRoll && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.sscRoll}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sscRegistration" className="text-gray-700 font-medium">
                        Registration Number
                      </Label>
                      <Input
                        type="text"
                        id="sscRegistration"
                        name="sscRegistration"
                        placeholder="SSC Registration Number"
                        className={`w-full px-4 py-3 border ${errors.sscRegistration ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.sscRegistration}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.sscRegistration && touched.sscRegistration && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.sscRegistration}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sscGpa" className="text-gray-700 font-medium">
                        GPA
                      </Label>
                      <Input
                        type="number"
                        id="sscGpa"
                        name="sscGpa"
                        placeholder="SSC GPA"
                        step="0.01"
                        min="0"
                        max="5"
                        className={`w-full px-4 py-3 border ${errors.sscGpa ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.sscGpa}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.sscGpa && touched.sscGpa && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.sscGpa}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sscYear" className="text-gray-700 font-medium">
                        Passing Year
                      </Label>
                      <Input
                        type="number"
                        id="sscYear"
                        name="sscYear"
                        placeholder="SSC Passing Year"
                        min="1990"
                        max={new Date().getFullYear()}
                        className={`w-full px-4 py-3 border ${errors.sscYear ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.sscYear}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.sscYear && touched.sscYear && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.sscYear}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="sscBoard" className="text-gray-700 font-medium">
                        Board
                      </Label>
                      <Select
                        value={formData.sscBoard}
                        onValueChange={(value) => handleSelectChange('sscBoard', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className={`w-full ${errors.sscBoard ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select SSC Board" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dhaka">Dhaka</SelectItem>
                          <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                          <SelectItem value="Chittagong">Chittagong</SelectItem>
                          <SelectItem value="Jessore">Jessore</SelectItem>
                          <SelectItem value="Comilla">Comilla</SelectItem>
                          <SelectItem value="Sylhet">Sylhet</SelectItem>
                          <SelectItem value="Barisal">Barisal</SelectItem>
                          <SelectItem value="Dinajpur">Dinajpur</SelectItem>
                          <SelectItem value="Madrasha">Madrasha</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.sscBoard && touched.sscBoard && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.sscBoard}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* HSC Details */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">HSC Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hscRoll" className="text-gray-700 font-medium">
                        Roll Number
                      </Label>
                      <Input
                        type="text"
                        id="hscRoll"
                        name="hscRoll"
                        placeholder="HSC Roll Number"
                        className={`w-full px-4 py-3 border ${errors.hscRoll ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.hscRoll}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.hscRoll && touched.hscRoll && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.hscRoll}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hscRegistration" className="text-gray-700 font-medium">
                        Registration Number
                      </Label>
                      <Input
                        type="text"
                        id="hscRegistration"
                        name="hscRegistration"
                        placeholder="HSC Registration Number"
                        className={`w-full px-4 py-3 border ${errors.hscRegistration ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.hscRegistration}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.hscRegistration && touched.hscRegistration && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.hscRegistration}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hscGpa" className="text-gray-700 font-medium">
                        GPA
                      </Label>
                      <Input
                        type="number"
                        id="hscGpa"
                        name="hscGpa"
                        placeholder="HSC GPA"
                        step="0.01"
                        min="0"
                        max="5"
                        className={`w-full px-4 py-3 border ${errors.hscGpa ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.hscGpa}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.hscGpa && touched.hscGpa && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.hscGpa}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hscYear" className="text-gray-700 font-medium">
                        Passing Year
                      </Label>
                      <Input
                        type="number"
                        id="hscYear"
                        name="hscYear"
                        placeholder="HSC Passing Year"
                        min="1990"
                        max={new Date().getFullYear()}
                        className={`w-full px-4 py-3 border ${errors.hscYear ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.hscYear}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.hscYear && touched.hscYear && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.hscYear}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="hscBoard" className="text-gray-700 font-medium">
                        Board
                      </Label>
                      <Select
                        value={formData.hscBoard}
                        onValueChange={(value) => handleSelectChange('hscBoard', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className={`w-full ${errors.hscBoard ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select HSC Board" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dhaka">Dhaka</SelectItem>
                          <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                          <SelectItem value="Chittagong">Chittagong</SelectItem>
                          <SelectItem value="Jessore">Jessore</SelectItem>
                          <SelectItem value="Comilla">Comilla</SelectItem>
                          <SelectItem value="Sylhet">Sylhet</SelectItem>
                          <SelectItem value="Barisal">Barisal</SelectItem>
                          <SelectItem value="Dinajpur">Dinajpur</SelectItem>
                          <SelectItem value="Madrasha">Madrasha</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.hscBoard && touched.hscBoard && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.hscBoard}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {formData.examPath === 'MADRASHA' && (
              <>
                {/* Dakhil Details */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dakhil Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dakhilRoll" className="text-gray-700 font-medium">
                        Roll Number
                      </Label>
                      <Input
                        type="text"
                        id="dakhilRoll"
                        name="dakhilRoll"
                        placeholder="Dakhil Roll Number"
                        className={`w-full px-4 py-3 border ${errors.dakhilRoll ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.dakhilRoll}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.dakhilRoll && touched.dakhilRoll && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.dakhilRoll}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dakhilRegistration" className="text-gray-700 font-medium">
                        Registration Number
                      </Label>
                      <Input
                        type="text"
                        id="dakhilRegistration"
                        name="dakhilRegistration"
                        placeholder="Dakhil Registration Number"
                        className={`w-full px-4 py-3 border ${errors.dakhilRegistration ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.dakhilRegistration}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.dakhilRegistration && touched.dakhilRegistration && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.dakhilRegistration}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dakhilGpa" className="text-gray-700 font-medium">
                        GPA
                      </Label>
                      <Input
                        type="number"
                        id="dakhilGpa"
                        name="dakhilGpa"
                        placeholder="Dakhil GPA"
                        step="0.01"
                        min="0"
                        max="5"
                        className={`w-full px-4 py-3 border ${errors.dakhilGpa ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.dakhilGpa}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.dakhilGpa && touched.dakhilGpa && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.dakhilGpa}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dakhilYear" className="text-gray-700 font-medium">
                        Passing Year
                      </Label>
                      <Input
                        type="number"
                        id="dakhilYear"
                        name="dakhilYear"
                        placeholder="Dakhil Passing Year"
                        min="1990"
                        max={new Date().getFullYear()}
                        className={`w-full px-4 py-3 border ${errors.dakhilYear ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.dakhilYear}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.dakhilYear && touched.dakhilYear && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.dakhilYear}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="dakhilBoard" className="text-gray-700 font-medium">
                        Board
                      </Label>
                      <Select
                        value={formData.dakhilBoard}
                        onValueChange={(value) => handleSelectChange('dakhilBoard', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className={`w-full ${errors.dakhilBoard ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select Dakhil Board" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dhaka">Dhaka</SelectItem>
                          <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                          <SelectItem value="Chittagong">Chittagong</SelectItem>
                          <SelectItem value="Jessore">Jessore</SelectItem>
                          <SelectItem value="Comilla">Comilla</SelectItem>
                          <SelectItem value="Sylhet">Sylhet</SelectItem>
                          <SelectItem value="Barisal">Barisal</SelectItem>
                          <SelectItem value="Dinajpur">Dinajpur</SelectItem>
                          <SelectItem value="Madrasha">Madrasha</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.dakhilBoard && touched.dakhilBoard && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.dakhilBoard}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alim Details */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Alim Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alimRoll" className="text-gray-700 font-medium">
                        Roll Number
                      </Label>
                      <Input
                        type="text"
                        id="alimRoll"
                        name="alimRoll"
                        placeholder="Alim Roll Number"
                        className={`w-full px-4 py-3 border ${errors.alimRoll ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.alimRoll}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.alimRoll && touched.alimRoll && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.alimRoll}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alimRegistration" className="text-gray-700 font-medium">
                        Registration Number
                      </Label>
                      <Input
                        type="text"
                        id="alimRegistration"
                        name="alimRegistration"
                        placeholder="Alim Registration Number"
                        className={`w-full px-4 py-3 border ${errors.alimRegistration ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.alimRegistration}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.alimRegistration && touched.alimRegistration && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.alimRegistration}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alimGpa" className="text-gray-700 font-medium">
                        GPA
                      </Label>
                      <Input
                        type="number"
                        id="alimGpa"
                        name="alimGpa"
                        placeholder="Alim GPA"
                        step="0.01"
                        min="0"
                        max="5"
                        className={`w-full px-4 py-3 border ${errors.alimGpa ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.alimGpa}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.alimGpa && touched.alimGpa && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.alimGpa}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alimYear" className="text-gray-700 font-medium">
                        Passing Year
                      </Label>
                      <Input
                        type="number"
                        id="alimYear"
                        name="alimYear"
                        placeholder="Alim Passing Year"
                        min="1990"
                        max={new Date().getFullYear()}
                        className={`w-full px-4 py-3 border ${errors.alimYear ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                        value={formData.alimYear}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                      />
                      {errors.alimYear && touched.alimYear && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.alimYear}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="alimBoard" className="text-gray-700 font-medium">
                        Board
                      </Label>
                      <Select
                        value={formData.alimBoard}
                        onValueChange={(value) => handleSelectChange('alimBoard', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className={`w-full ${errors.alimBoard ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select Alim Board" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dhaka">Dhaka</SelectItem>
                          <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                          <SelectItem value="Chittagong">Chittagong</SelectItem>
                          <SelectItem value="Jessore">Jessore</SelectItem>
                          <SelectItem value="Comilla">Comilla</SelectItem>
                          <SelectItem value="Sylhet">Sylhet</SelectItem>
                          <SelectItem value="Barisal">Barisal</SelectItem>
                          <SelectItem value="Dinajpur">Dinajpur</SelectItem>
                          <SelectItem value="Madrasha">Madrasha</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.alimBoard && touched.alimBoard && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.alimBoard}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  className={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="text-red-500 text-sm flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-red-500 text-sm flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="mt-1 h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                required
                disabled={isLoading}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the <a href="#" className="text-gray-900 hover:text-gray-700 transition">Terms of Service</a> and <a href="#" className="text-gray-900 hover:text-gray-700 transition">Privacy Policy</a>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition duration-300 flex items-center justify-center gap-2 mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <GraduationCap className="h-5 w-5" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-gray-900 hover:text-gray-700 transition">
              Login
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              UniForm - A Web Engineering Lab Project for Bangladesh University Admissions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
