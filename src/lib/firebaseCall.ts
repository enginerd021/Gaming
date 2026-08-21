'use client';

import * as firestore from 'firebase/firestore';
import { useAppStore } from '@/store/useAppStore';

const isAuthOrPermissionError = (error: any): boolean => {
  if (!error) return false;
  
  const code = error.code || '';
  const message = error.message || '';
  
  return (
    code.includes('token-expired') ||
    code.includes('auth/id-token-expired') ||
    code.includes('auth/user-token-expired') ||
    code.includes('permission-denied') ||
    code.includes('unauthorized') ||
    message.includes('token expired') ||
    message.includes('permission-denied') ||
    message.includes('Missing or insufficient permissions')
  );
};

const handleFirebaseError = (error: any) => {
  if (isAuthOrPermissionError(error)) {
    console.warn("Session expired or permission denied caught in firebaseCall wrapper:", error);
    useAppStore.setState({ sessionExpired: true });
  }
};

// Return type is Promise<any> to prevent TS 'unknown' errors at call sites
export async function getDoc(ref: any): Promise<any> {
  try {
    return await firestore.getDoc(ref);
  } catch (error) {
    handleFirebaseError(error);
    throw error;
  }
}

export async function getDocs(query: any): Promise<any> {
  try {
    return await firestore.getDocs(query);
  } catch (error) {
    handleFirebaseError(error);
    throw error;
  }
}

export async function updateDoc(ref: any, ...args: any[]): Promise<any> {
  try {
    return await (firestore.updateDoc as any)(ref, ...args);
  } catch (error) {
    handleFirebaseError(error);
    throw error;
  }
}

export async function setDoc(ref: any, ...args: any[]): Promise<any> {
  try {
    return await (firestore.setDoc as any)(ref, ...args);
  } catch (error) {
    handleFirebaseError(error);
    throw error;
  }
}

export async function deleteDoc(ref: any): Promise<any> {
  try {
    return await firestore.deleteDoc(ref);
  } catch (error) {
    handleFirebaseError(error);
    throw error;
  }
}

export async function addDoc(ref: any, ...args: any[]): Promise<any> {
  try {
    return await (firestore.addDoc as any)(ref, ...args);
  } catch (error) {
    handleFirebaseError(error);
    throw error;
  }
}

// Wrapper for writeBatch to intercept commit()
export function writeBatch(db: any): any {
  const batch = firestore.writeBatch(db);
  const originalCommit = batch.commit.bind(batch);
  batch.commit = async () => {
    try {
      return await originalCommit();
    } catch (error) {
      handleFirebaseError(error);
      throw error;
    }
  };
  return batch;
}

// Overloads for onSnapshot to preserve parameter type inference at call sites
export function onSnapshot(
  ref: any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
): firestore.Unsubscribe;
export function onSnapshot(
  ref: any,
  options: any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
): firestore.Unsubscribe;
export function onSnapshot(...args: any[]): firestore.Unsubscribe {
  let errorCallbackIdx = -1;
  
  if (typeof args[1] === 'function') {
    if (typeof args[2] === 'function') {
      errorCallbackIdx = 2;
    }
  } else if (typeof args[2] === 'function') {
    if (typeof args[3] === 'function') {
      errorCallbackIdx = 3;
    }
  }
  
  if (errorCallbackIdx !== -1) {
    const originalOnError = args[errorCallbackIdx];
    args[errorCallbackIdx] = (error: any) => {
      handleFirebaseError(error);
      originalOnError(error);
    };
  } else {
    // If no error callback was provided, inject one to capture authorization failures
    if (args.length === 2 && typeof args[1] === 'function') {
      const originalOnNext = args[1];
      const newOnError = (error: any) => {
        handleFirebaseError(error);
        console.error("Uncaught Firebase listener error in wrapper:", error);
      };
      return firestore.onSnapshot(args[0], originalOnNext, newOnError);
    }
  }
  
  return (firestore.onSnapshot as any)(...args);
}
