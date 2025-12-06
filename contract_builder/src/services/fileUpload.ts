import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function uploadSignedContract(
  contractId: string,
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Create a reference to the file location in Firebase Storage
    const storageRef = ref(storage, `signed-contracts/${contractId}/${file.name}`);
    
    // Upload the file with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Return a promise that resolves when upload is complete
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          // Calculate progress percentage
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(new Error('Failed to upload signed contract'));
        },
        async () => {
          try {
            // Get the download URL
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update the contract document with the signed contract info
            const contractRef = doc(db, 'groupContracts', contractId);
            await updateDoc(contractRef, {
              signedContractUrl: downloadUrl,
              signedContractUploadedAt: new Date(),
              signedContractUploadedBy: userId
            });
            
            resolve(downloadUrl);
          } catch (error) {
            console.error('Error getting download URL or updating document:', error);
            reject(new Error('Failed to complete upload process'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading signed contract:', error);
    throw new Error('Failed to upload signed contract');
  }
}

export async function deleteSignedContract(
  contractId: string,
  fileUrl: string
): Promise<void> {
  try {
    // Extract the file path from the URL
    const filePath = extractFilePathFromUrl(fileUrl);
    if (!filePath) {
      throw new Error('Invalid file URL');
    }
    
    // Create a reference to the file
    const storageRef = ref(storage, filePath);
    
    // Delete the file
    await deleteObject(storageRef);
    
    // Update the contract document to remove the signed contract info
    const contractRef = doc(db, 'groupContracts', contractId);
    await updateDoc(contractRef, {
      signedContractUrl: null,
      signedContractUploadedAt: null,
      signedContractUploadedBy: null
    });
  } catch (error) {
    console.error('Error deleting signed contract:', error);
    throw new Error('Failed to delete signed contract');
  }
}

function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
    return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
  } catch {
    return null;
  }
}

export function validateContractFile(file: File): { isValid: boolean; error?: string } {
  // Check file type (only allow PDF)
  const allowedTypes = ['application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only PDF files are allowed' };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }
  
  return { isValid: true };
}
