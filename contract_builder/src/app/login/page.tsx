"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
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
      setError(err.message);
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
        </VStack>
      </form>
    </Box>
  );
}
