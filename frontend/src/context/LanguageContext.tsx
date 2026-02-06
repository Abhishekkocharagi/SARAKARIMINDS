'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '../translations';
import { useAuth } from './AuthContext';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('en');
    const { user, updateUser } = useAuth();

    // Initialize language from localStorage or User profile
    useEffect(() => {
        const storedLang = localStorage.getItem('language') as Language;
        if (user?.language) {
            setLanguageState(user.language as Language);
        } else if (storedLang) {
            setLanguageState(storedLang);
        }
    }, [user]);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);

        if (user) {
            // Update on backend if logged in
            try {
                const res = await fetch('http://localhost:5000/api/users/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify({ language: lang })
                });
                if (res.ok) {
                    updateUser({ language: lang });
                }
            } catch (err) {
                console.error('Failed to sync language preference with backend:', err);
            }
        }
    };

    const t = (key: TranslationKey): string => {
        const entry = translations[key] as any;
        return entry?.[language] || entry?.['en'] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
