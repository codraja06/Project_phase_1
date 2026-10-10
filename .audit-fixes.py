from pathlib import Path

def edit(path, old, new):
 p=Path(path); s=p.read_text(encoding='utf-8'); assert old in s, (path,old[:60]); p.write_text(s.replace(old,new),encoding='utf-8')

p=Path('backend/src/controllers/authController.ts'); s=p.read_text(); start=s.index('    const { token, role'); end=s.index('    const appToken',start)
s=s[:start]+'''    const { token, role = 'citizen' } = req.body;
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

'''+s[end:]; s=s.replace("import axios from 'axios';","import { OAuth2Client } from 'google-auth-library';\nimport { env } from '../config/env';"); p.write_text(s)
edit('backend/src/config/env.ts',"import path from 'path';","import path from 'path';\nimport { randomBytes } from 'crypto';")
edit('backend/src/config/env.ts','export const env = {',"if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {\n  throw new Error('Set JWT_SECRET to at least 32 random characters in production.');\n}\n\nexport const env = {")
edit('backend/src/config/env.ts',"process.env.JWT_SECRET || 'super_secret_jwt_key_civic_issue_detection_2026'","process.env.JWT_SECRET || randomBytes(48).toString('hex')")
edit('backend/src/config/env.ts',"  GOOGLE_MAPS_API_KEY:","  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',\n  GOOGLE_MAPS_API_KEY:")
edit('backend/src/validators/complaintValidator.ts',"imageUrl: z.string().min(1, 'Image is required'),","imageUrl: z.string().url('A successfully uploaded image URL is required').refine((url) => /^https?:\\/\\//i.test(url), 'Upload the image before submitting'),")
edit('backend/src/validators/complaintValidator.ts',"latitude: z.coerce.number().default(12.9716),\n  longitude: z.coerce.number().default(77.5946),","latitude: z.number().finite().min(-90).max(90),\n  longitude: z.number().finite().min(-180).max(180),")
edit('backend/src/validators/complaintValidator.ts',"  complaintId: z.string().optional(),",'')
for f in ['backend/src/controllers/complaintController.ts','backend/src/controllers/authorityController.ts']:
 edit(f,'    if (search) {',"    if (search && typeof search === 'string') {\n      const literalSearch = search.slice(0, 200).replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');")
 edit(f,'$regex: search','$regex: literalSearch')
 edit(f,"if (category && category !== 'All' && category !== 'all')", "if (typeof category === 'string' && category !== 'All' && category !== 'all')")
 edit(f,"if (status && status !== 'All' && status !== 'all')", "if (typeof status === 'string' && status !== 'All' && status !== 'all')")

p=Path('mobile/src/services/googleAuth.ts'); s=p.read_text(); i=s.index('      // Robust development'); s=s[:i]+"      throw new Error('Google sign-in is not configured. Please use email and password.');\n    }\n  },\n};\n"; s=s.replace("Math.random().toString(36).substring(7)","Crypto.randomUUID()"); s=s.replace("params.get('id_token') || params.get('access_token')","params.get('id_token')"); s="import * as Crypto from 'expo-crypto';\n"+s; p.write_text(s)
edit('mobile/src/context/AuthContext.tsx','      setToken(null);\n      setUser(null);\n    });','      setToken(null);\n      setUser(null);\n      setSavedSession(null);\n    });')
edit('mobile/src/context/AuthContext.tsx','    // Activate session into context\n    setToken(savedSession.token);\n    setUser(savedSession.user);\n    return savedSession.user;',"    const verifiedUser = await authApi.getMe();\n    if (expectedRole && verifiedUser.role !== expectedRole) throw new Error('Please use the correct account portal.');\n    setToken(savedSession.token);\n    setUser(verifiedUser);\n    return verifiedUser;")
# Persist before mounting screens that immediately request authenticated data.
p=Path('mobile/src/context/AuthContext.tsx'); s=p.read_text(); block='''    setToken(result.token);
    setUser(result.user);
    setSavedSession({ user: result.user, token: result.token });
    await storageService.setToken(result.token);
    await storageService.setUser(result.user);'''; s=s.replace(block,'''    await storageService.setToken(result.token);
    await storageService.setUser(result.user);
    setToken(result.token);
    setUser(result.user);
    setSavedSession({ user: result.user, token: result.token });'''); p.write_text(s)
edit('mobile/src/constants/config.ts',"  if (Platform.OS === 'web') {", "  if (envUrl && !envUrl.includes('YOUR_LAN_IP')) return envUrl.replace(/\\/$/, '');\n\n  if (Platform.OS === 'web') {")
edit('mobile/src/constants/config.ts',"return `http://${window.location.hostname}:5000/api`;","return `${window.location.protocol}//${window.location.hostname}:5000/api`;")
edit('mobile/src/constants/config.ts',"return 'http://192.168.29.44:5000/api';", "return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://127.0.0.1:5000/api';")
p=Path('mobile/App.tsx'); s=p.read_text(); a=s.index('  style.textContent = `'); b=s.index('  document.head.appendChild',a); s=s[:a]+'''  style.textContent = `
    html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; background: #F8FAFC; }
    #root { display: flex; flex-direction: column; min-height: 100dvh; }
    :focus-visible { outline: 3px solid #B71C1C !important; outline-offset: 3px; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; animation-delay: 0ms !important; transition-duration: 0.01ms !important; }
    }
  `;
'''+s[b:]; p.write_text(s)
edit('mobile/src/components/AuthoritySidebar.tsx',"import React, { useState } from 'react';","import React, { useState } from 'react';\nimport { useAuth } from '../hooks/useAuth';")
edit('mobile/src/components/AuthoritySidebar.tsx',"  const [hoveredRoute", "  const { user } = useAuth();\n  const [hoveredRoute")
edit('mobile/src/components/AuthoritySidebar.tsx','>JD</Text>',">{user?.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</Text>")
edit('mobile/src/components/AuthoritySidebar.tsx','>John Doe</Text>',">{user?.name || 'Officer'}</Text>")
for f in ['mobile/src/navigation/AuthorityNavigator.tsx','mobile/src/navigation/CitizenNavigator.tsx']:
 edit(f,'    [isDesktop]','    [isDesktop, activeRoute]')
 edit(f,'<View style={{ flex: 1 }}>','<View style={{ flex: 1, minWidth: 0 }}>')
edit('mobile/src/components/ui/Card.tsx','        onPress={onPress}','        accessibilityRole="button"\n        onPress={onPress}')
edit('mobile/src/components/ui/Button.tsx',"          console.log('Button Pressed:', title);\n",'')
edit('mobile/src/components/ui/Button.tsx','const base: TextStyle = { ...TYPOGRAPHY.button };','const base: TextStyle = { ...TYPOGRAPHY.button, flexShrink: 1 };')
edit('mobile/src/components/Input.tsx','    flex: 1,\n    ...TYPOGRAPHY.input','    flex: 1,\n    minWidth: 0,\n    ...TYPOGRAPHY.input')
