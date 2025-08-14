// uniform-frontend/src/api/index.ts
import axios from "axios";
import type { User } from "@/context/AuthContext";
import type { Institution, AcademicInfo, Application, UserData } from "@/components/student/types";

// Update the API URL to use the environment variable from Vite
const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {

    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      config.headers.Authorization = accessToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Register User - Updated to include academic details
export const registerUser = async (userData: {
  userName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  role: string;
  dob: string;
  examPath: string;
  medium: string;
  // Academic details
  sscRoll?: string;
  sscRegistration?: string;
  sscGpa?: string;
  sscYear?: string;
  sscBoard?: string;
  hscRoll?: string;
  hscRegistration?: string;
  hscGpa?: string;
  hscYear?: string;
  hscBoard?: string;
  dakhilRoll?: string;
  dakhilRegistration?: string;
  dakhilGpa?: string;
  dakhilYear?: string;
  dakhilBoard?: string;
  alimRoll?: string;
  alimRegistration?: string;
  alimGpa?: string;
  alimYear?: string;
  alimBoard?: string;
}): Promise<User | null> => {
  try {
    // Transform frontend data to match backend schema
    const backendData = {
      fullName: userData.userName,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      password_confirmation: userData.password,
      address: userData.address,
      role: userData.role,
      dob: new Date(userData.dob).toISOString(), // Convert to ISO string format
      examPath: userData.examPath,
      medium: userData.medium,
      // Include academic details based on examPath
      ...(userData.examPath === 'NATIONAL' && {
        sscRoll: userData.sscRoll,
        sscRegistration: userData.sscRegistration,
        sscGpa: userData.sscGpa ? parseFloat(userData.sscGpa) : undefined,
        sscYear: userData.sscYear ? parseInt(userData.sscYear) : undefined,
        sscBoard: userData.sscBoard,
        hscRoll: userData.hscRoll,
        hscRegistration: userData.hscRegistration,
        hscGpa: userData.hscGpa ? parseFloat(userData.hscGpa) : undefined,
        hscYear: userData.hscYear ? parseInt(userData.hscYear) : undefined,
        hscBoard: userData.hscBoard,
      }),
      ...(userData.examPath === 'MADRASHA' && {
        dakhilRoll: userData.dakhilRoll,
        dakhilRegistration: userData.dakhilRegistration,
        dakhilGpa: userData.dakhilGpa ? parseFloat(userData.dakhilGpa) : undefined,
        dakhilYear: userData.dakhilYear ? parseInt(userData.dakhilYear) : undefined,
        dakhilBoard: userData.dakhilBoard,
        alimRoll: userData.alimRoll,
        alimRegistration: userData.alimRegistration,
        alimGpa: userData.alimGpa ? parseFloat(userData.alimGpa) : undefined,
        alimYear: userData.alimYear ? parseInt(userData.alimYear) : undefined,
        alimBoard: userData.alimBoard,
      }),
    };

    const response = await api.post('/auth/register', backendData);

    if (response.data.status === 200) {
      // Transform backend response to frontend User format
      const backendUser = response.data.user;

      const frontendUser: User = {
        userId: backendUser.studentId,
        userName: backendUser.fullName,
        email: backendUser.email,
        phone: backendUser.phone || '',
        password: '', // Don't store password
        address: backendUser.address || '',
        role: backendUser.role,
        dob: backendUser.dob || '',
        examPath: backendUser.examPath || '',
        medium: backendUser.medium || '',
        // Academic details
        sscRoll: backendUser.sscRoll,
        sscRegistration: backendUser.sscRegistration,
        sscGpa: backendUser.sscGpa?.toString(),
        sscYear: backendUser.sscYear?.toString(),
        sscBoard: backendUser.sscBoard,
        hscRoll: backendUser.hscRoll,
        hscRegistration: backendUser.hscRegistration,
        hscGpa: backendUser.hscGpa?.toString(),
        hscYear: backendUser.hscYear?.toString(),
        hscBoard: backendUser.hscBoard,
        dakhilRoll: backendUser.dakhilRoll,
        dakhilRegistration: backendUser.dakhilRegistration,
        dakhilGpa: backendUser.dakhilGpa?.toString(),
        dakhilYear: backendUser.dakhilYear?.toString(),
        dakhilBoard: backendUser.dakhilBoard,
        alimRoll: backendUser.alimRoll,
        alimRegistration: backendUser.alimRegistration,
        alimGpa: backendUser.alimGpa?.toString(),
        alimYear: backendUser.alimYear?.toString(),
        alimBoard: backendUser.alimBoard,
      };
      return frontendUser;
    }
    return null;
  } catch (error) {
    console.error("Registration Failed:", error);
    throw error;
  }
};


// Student Login
export const userLogin = async (
  email: string,
  password: string,
  role: string = "STUDENT"
): Promise<User | null> => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
      role
    });
    if (response.data.status === 200) {
      localStorage.setItem('accessToken', response.data.access_token);
      const userProfile = await getUserProfile();
      return userProfile;
    }
    return null;
  } catch (error) {
    console.error("Login Failed:", error);
    throw error;
  }
};

// Get Student Profile - Updated to include academic details
export const getUserProfile = async (): Promise<User | null> => {
  try {
    const response = await api.get('/profile');
    if (response.data.status === 200) {
      const backendProfile = response.data.profile;
      const frontendUser: User = {
        userId: backendProfile.studentId,
        userName: backendProfile.fullName,
        email: backendProfile.email,
        phone: backendProfile.phone || '',
        password: '', // Don't store password
        address: backendProfile.address || '',
        role: backendProfile.role,
        dob: backendProfile.dob || '',
        examPath: backendProfile.examPath || '',
        medium: backendProfile.medium || '',
        // Academic details
        sscRoll: backendProfile.sscRoll,
        sscRegistration: backendProfile.sscRegistration,
        sscGpa: backendProfile.sscGpa?.toString(),
        sscYear: backendProfile.sscYear?.toString(),
        sscBoard: backendProfile.sscBoard,
        hscRoll: backendProfile.hscRoll,
        hscRegistration: backendProfile.hscRegistration,
        hscGpa: backendProfile.hscGpa?.toString(),
        hscYear: backendProfile.hscYear?.toString(),
        hscBoard: backendProfile.hscBoard,
        dakhilRoll: backendProfile.dakhilRoll,
        dakhilRegistration: backendProfile.dakhilRegistration,
        dakhilGpa: backendProfile.dakhilGpa?.toString(),
        dakhilYear: backendProfile.dakhilYear?.toString(),
        dakhilBoard: backendProfile.dakhilBoard,
        alimRoll: backendProfile.alimRoll,
        alimRegistration: backendProfile.alimRegistration,
        alimGpa: backendProfile.alimGpa?.toString(),
        alimYear: backendProfile.alimYear?.toString(),
        alimBoard: backendProfile.alimBoard,
      };
      return frontendUser;
    }
    return null;
  } catch (error) {
    console.error("Get User Profile Failed:", error);
    return null;
  }
};

// Get Academic Details - New function
export const getAcademicDetails = async (): Promise<User | null> => {
  try {
    const response = await api.get('/profile/academic');
    if (response.data.status === 200) {
      const academicDetails = response.data.academicDetails;
      const frontendUser: User = {
        userId: academicDetails.studentId,
        userName: '',
        email: '',
        phone: '',
        password: '',
        address: '',
        role: '',
        dob: '',
        examPath: academicDetails.examPath || '',
        medium: academicDetails.medium || '',
        // Academic details
        sscRoll: academicDetails.sscRoll,
        sscRegistration: academicDetails.sscRegistration,
        sscGpa: academicDetails.sscGpa?.toString(),
        sscYear: academicDetails.sscYear?.toString(),
        sscBoard: academicDetails.sscBoard,
        hscRoll: academicDetails.hscRoll,
        hscRegistration: academicDetails.hscRegistration,
        hscGpa: academicDetails.hscGpa?.toString(),
        hscYear: academicDetails.hscYear?.toString(),
        hscBoard: academicDetails.hscBoard,
        dakhilRoll: academicDetails.dakhilRoll,
        dakhilRegistration: academicDetails.dakhilRegistration,
        dakhilGpa: academicDetails.dakhilGpa?.toString(),
        dakhilYear: academicDetails.dakhilYear?.toString(),
        dakhilBoard: academicDetails.dakhilBoard,
        alimRoll: academicDetails.alimRoll,
        alimRegistration: academicDetails.alimRegistration,
        alimGpa: academicDetails.alimGpa?.toString(),
        alimYear: academicDetails.alimYear?.toString(),
        alimBoard: academicDetails.alimBoard,
      };
      return frontendUser;
    }
    return null;
  } catch (error) {
    console.error("Get Academic Details Failed:", error);
    return null;
  }
};

// Update User Profile - Updated to handle more than just profile image
// Define the interface separately
export interface ProfileData {
  profileImage?: File;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  dob?: string;
  examPath?: string;
  medium?: string;

  // Academic details for NATIONAL
  sscRoll?: string;
  sscRegistration?: string;
  sscGpa?: string;
  sscYear?: string;
  sscBoard?: string;
  hscRoll?: string;
  hscRegistration?: string;
  hscGpa?: string;
  hscYear?: string;
  hscBoard?: string;

  // Academic details for MADRASHA
  dakhilRoll?: string;
  dakhilRegistration?: string;
  dakhilGpa?: string;
  dakhilYear?: string;
  dakhilBoard?: string;
  alimRoll?: string;
  alimRegistration?: string;
  alimGpa?: string;
  alimYear?: string;
  alimBoard?: string;
}

export const updateUserProfile = async (
  userId: string,
  profileData: ProfileData
): Promise<boolean> => {
  try {
    const formData = new FormData();

    // Add profile image
    if (profileData.profileImage) {
      formData.append('profile', profileData.profileImage);
    }

    // Append non-academic fields
    const basicFields: (keyof ProfileData)[] = [
      'fullName', 'email', 'phone', 'address', 'dob', 'examPath', 'medium'
    ];

    basicFields.forEach((field) => {
      if (profileData[field] !== undefined && profileData[field] !== null) {
        formData.append(field, String(profileData[field]));
      }
    });

    // Append academic details based on examPath
    if (profileData.examPath === 'NATIONAL') {
      const nationalFields: (keyof ProfileData)[] = [
        'sscRoll', 'sscRegistration', 'sscGpa', 'sscYear', 'sscBoard',
        'hscRoll', 'hscRegistration', 'hscGpa', 'hscYear', 'hscBoard'
      ];
      nationalFields.forEach((field) => {
        if (profileData[field] !== undefined && profileData[field] !== null) {
          formData.append(field, String(profileData[field]));
        }
      });
    }

    if (profileData.examPath === 'MADRASHA') {
      const madrashaFields: (keyof ProfileData)[] = [
        'dakhilRoll', 'dakhilRegistration', 'dakhilGpa', 'dakhilYear', 'dakhilBoard',
        'alimRoll', 'alimRegistration', 'alimGpa', 'alimYear', 'alimBoard'
      ];
      madrashaFields.forEach((field) => {
        if (profileData[field] !== undefined && profileData[field] !== null) {
          formData.append(field, String(profileData[field]));
        }
      });
    }

    // Debug log
    // for (const [key, value] of formData.entries()) {
    //   console.log(`${key}:`, value);
    // }

    const response = await api.put(`/profile/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.status === 200;
  } catch (error) {
    console.error("Update User Profile Failed:", error);
    return false;
  }
};


// Get Institutions
export const getInstitutions = async (): Promise<Institution[]> => {
  try {
    const response = await api.get<Institution[]>('/institutions');
    return response.data;
  } catch (error) {
    console.error("Get Institutions Failed:", error);
    return [];
  }
};

// Get Academic Info by User ID - Deprecated in favor of getAcademicDetails
export const getAcademicInfo = async (userId: string): Promise<AcademicInfo | null> => {
  try {
    const response = await api.get(`/academicInfo?userId=${userId}`);
    return response.data.academicDetails || null;
  } catch (error) {
    console.error("Get Academic Info Failed:", error);
    return null;
  }
};

// Create or Update Academic Info - Deprecated in favor of updateUserProfile
export const saveAcademicInfo = async (academicInfo: AcademicInfo): Promise<AcademicInfo | null> => {
  try {
    const { id, ...data } = academicInfo;
    if (id) {
      const response = await api.put<AcademicInfo>(`/academicInfo/${id}`, data);
      return response.data;
    } else {
      const response = await api.post<AcademicInfo>('/academicInfo', data);
      return response.data;
    }
  } catch (error) {
    console.error("Save Academic Info Failed:", error);
    return null;
  }
};

// Get Applications by User ID
export const getApplications = async (userId: string): Promise<Application[]> => {
  try {
    const response = await api.get<Application[]>(`/applications?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error("Get Applications Failed:", error);
    return [];
  }
};

// Submit Application
export const submitApplication = async (application: Omit<Application, 'id'>): Promise<Application | null> => {
  try {
    const response = await api.post<Application>('/applications', application);
    return response.data;
  } catch (error) {
    console.error("Submit Application Failed:", error);
    return null;
  }
};

// Update Application Status
export const updateApplicationStatus = async (
  applicationId: string,
  status: Application['status']
): Promise<Application | null> => {
  try {
    const response = await api.patch<Application>(`/applications/${applicationId}`, { status });
    return response.data;
  } catch (error) {
    console.error("Update Application Status Failed:", error);
    return null;
  }
};

// Get Institution by ID
export const getInstitutionById = async (institutionId: string): Promise<Institution | null> => {
  try {
    const response = await api.get<Institution>(`/institutions/${institutionId}`);
    return response.data;
  } catch (error) {
    console.error("Get Institution Failed:", error);
    return null;
  }
};

// Get User by ID
export const getUserById = async (userId: string): Promise<UserData | null> => {
  try {
    const response = await api.get<UserData>(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Get User Failed:", error);
    return null;
  }
};

export type { Institution, AcademicInfo, Application, UserData };
