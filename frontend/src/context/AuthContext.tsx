'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    accountType: string;
    token: string;
    profilePic?: string;
    coverPic?: string;
    about?: string;
    exams?: string[];
    preferredExams?: any[];
    receiveAllNotifications?: boolean;
    connectionsCount?: number;
    followersCount?: number;
    followingCount?: number;
    mentorApplicationStatus?: string;
    academyApplicationStatus?: string;
    examHashtags?: string[];
    language?: string;
    isVerified?: boolean;
    mentorshipEnabled?: boolean;
    mentorshipPrice?: number;
    savedPosts?: string[];
    dailyQuizStreakCount?: number;
    lastDailyQuizAttemptDate?: string;
    dailyGameStreakCount?: number;
    lastDailyGameAttemptDate?: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    updateUser: (newData: Partial<User>) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check local storage on load
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (err) {
                console.error('Failed to parse user data');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const updateUser = (newData: Partial<User>) => {
        setUser(prevUser => {
            if (!prevUser) return null;
            const updatedUser = { ...prevUser, ...newData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, updateUser, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
