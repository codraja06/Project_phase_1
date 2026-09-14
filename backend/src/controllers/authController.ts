import { Response, NextFunction } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/authValidator';

export const register = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists.');
    }

    const user = await User.create(validated);
    const token = generateToken({ userId: user._id.toString(), role: user.role });

    res.status(201).json(
      new ApiResponse('User registered successfully', {
        user,
        token,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email });
    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const isMatch = await user.comparePassword(validated.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const token = generateToken({ userId: user._id.toString(), role: user.role });

    res.status(200).json(
      new ApiResponse('Login successful', {
        user,
        token,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { token, role = 'citizen', userInfo } = req.body;

    let email = userInfo?.email;
    let name = userInfo?.name;
    let picture = userInfo?.picture || userInfo?.avatar || '';
    let googleId = userInfo?.id || userInfo?.googleId || '';

    // If Google token is provided, verify against Google
    if (token) {
      try {
        const verifyRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (verifyRes.data && verifyRes.data.email) {
          email = verifyRes.data.email;
          name = verifyRes.data.name || name || email.split('@')[0];
          picture = verifyRes.data.picture || picture;
          googleId = verifyRes.data.sub || googleId;
        }
      } catch (tokenErr) {
        try {
          const userinfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userinfoRes.data && userinfoRes.data.email) {
            email = userinfoRes.data.email;
            name = userinfoRes.data.name || name || email.split('@')[0];
            picture = userinfoRes.data.picture || picture;
            googleId = userinfoRes.data.sub || googleId;
          }
        } catch (accessErr) {
          if (!email) {
            throw new ApiError(401, 'Google authentication token verification failed.');
          }
        }
      }
    }

    if (!email) {
      throw new ApiError(400, 'Email is required from Google authentication.');
    }

    email = email.toLowerCase().trim();

    let user = await User.findOne({ email });

    if (!user) {
      const selectedRole = role === 'authority' ? 'authority' : 'citizen';
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        phone: '',
        role: selectedRole,
        googleId,
        avatar: picture,
      });
    } else {
      let modified = false;
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    const appToken = generateToken({ userId: user._id.toString(), role: user.role });

    res.status(200).json(
      new ApiResponse('Google authentication successful', {
        user,
        token: appToken,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: AuthRequest, res: Response) => {
  res.status(200).json(new ApiResponse('Logged out successfully', null));
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }
    res.status(200).json(new ApiResponse('Current user retrieved', req.user));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const validated = updateProfileSchema.parse(req.body);
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (validated.name) user.name = validated.name;
    if (validated.phone) user.phone = validated.phone;

    await user.save();

    res.status(200).json(new ApiResponse('Profile updated successfully', user));
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const validated = changePasswordSchema.parse(req.body);
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await user.comparePassword(validated.oldPassword);
    if (!isMatch) {
      throw new ApiError(400, 'Incorrect old password.');
    }

    user.password = validated.newPassword;
    await user.save();

    res.status(200).json(new ApiResponse('Password changed successfully', null));
  } catch (error) {
    next(error);
  }
};
