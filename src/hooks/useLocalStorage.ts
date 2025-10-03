import { useState } from 'react';
import { User } from '../types/user.types';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };
  
  return [storedValue, setValue] as const;
};

export const useUsers = () => {
  const [users, setUsers] = useLocalStorage<User[]>('authvision_users', []);
  
  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };
  
  const findUser = (email: string) => {
    return users.find(user => user.email === email);
  };
  
  const findUserByNickname = (nickname: string) => {
    return users.find(user => user.nickname === nickname);
  };
  
  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ));
  };
  
  return {
    users,
    addUser,
    findUser,
    findUserByNickname,
    updateUser
  };
};