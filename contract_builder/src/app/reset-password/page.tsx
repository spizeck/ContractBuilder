"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
} from "@chakra-ui/react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!oobCode) {
      setError("Invalid or missing reset code.");
      return;
    }

    // Check the code and get the associated email
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmail(email);
      })
      .catch(() => {
        setError("Reset link is invalid or has expired.");
      });
  }, [oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oobCode) return;
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage("Password has been reset successfully.");
      setError(null);
      setTimeout(() => router.push("/login"), 2000);
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
      <form onSubmit={handleReset}>
        <Text fontSize="lg" fontWeight="bold">
          Reset Password
        </Text>
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold">
            Reset Password
          </Text>

          {email && <Text>Resetting password for: {email}</Text>}

          <FormControl isRequired>
            <FormLabel>New Password</FormLabel>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Confirm Password</FormLabel>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
            />
          </FormControl>

          {error && <Text color="red.500">{error}</Text>}
          {message && <Text color="green.500">{message}</Text>}

          <Button type="submit" colorScheme="teal" width="100%">
            Reset Password
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
