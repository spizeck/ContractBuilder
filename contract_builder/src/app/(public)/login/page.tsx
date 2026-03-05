"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@core/db/firebase";
import { useRouter } from "next/navigation";
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Link,
  Divider,
  HStack,
} from "@chakra-ui/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      const code = err?.code
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.')
      } else {
        setError('An error occurred. Please try again.')
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if Firestore user doc exists; if not, create one as viewer
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || '',
          role: 'viewer',
          createdAt: serverTimestamp(),
        });
      }

      router.push("/");
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, not an error
        return;
      }
      setError('Google sign-in failed. Please try again.');
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent. Please check your inbox.");
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setMessage(null);
    }
  };

  return (
    <Box
      p={6}
      maxW="500px"
      mx="auto"
      mt={10}
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="lg"
    >
      <form onSubmit={handleLogin}>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>
          Login
        </Text>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              suppressHydrationWarning
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              suppressHydrationWarning
            />
          </FormControl>

          {error && <Text color="red.500">{error}</Text>}
          {message && <Text color="green.500">{message}</Text>}

          <Button type="submit" colorScheme="teal" width="100%">
            Login
          </Button>

          {/* Forgot Password Link */}
          <Link
            color="teal.500"
            fontSize="sm"
            textAlign="center"
            onClick={handlePasswordReset}
            cursor="pointer"
          >
            Forgot your password?
          </Link>

          <HStack>
            <Divider />
            <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
              or
            </Text>
            <Divider />
          </HStack>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            width="100%"
          >
            Sign in with Google
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
