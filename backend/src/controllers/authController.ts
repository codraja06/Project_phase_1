import { Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
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
    const { token, role = 'citizen' } = req.body;
    if (!token || typeof token !== 'string') throw new ApiError(401, 'A verified Google ID token is required.');
    if (!env.GOOGLE_CLIENT_ID) throw new ApiError(503, 'Google sign-in is not configured. Please use email and password.');
    let identity;
    try {
      const ticket = await new OAuth2Client(env.GOOGLE_CLIENT_ID).verifyIdToken({ idToken: token, audience: env.GOOGLE_CLIENT_ID });
      identity = ticket.getPayload();
    } catch {
      throw new ApiError(401, 'Google authentication token verification failed.');
    }
    if (!identity?.email || !identity.email_verified || !identity.sub) throw new ApiError(401, 'A verified Google email is required.');
    const email = identity.email.toLowerCase().trim();
    let user = await User.findOne({ email });
    if (!user && role === 'authority') throw new ApiError(403, 'Officer accounts must be provisioned by your administrator.');
    if (user && user.role !== role) throw new ApiError(403, 'Please use the login portal for your account role.');
    // Link existing accounts only after their password has established ownership.
    if (user && user.googleId !== identity.sub) throw new ApiError(401, 'Use email and password to sign in to this existing account.');
    if (!user) {
      user = await User.create({ name: identity.name || email.split('@')[0], email, role: 'citizen', googleId: identity.sub, avatar: identity.picture || '' });
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
