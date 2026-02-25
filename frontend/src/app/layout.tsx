import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { NavigationProvider } from '@/context/NavigationContext';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'SarkariMinds',
    description: 'Connecting Karnataka\'s Exam Aspirants',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={outfit.className} suppressHydrationWarning>
                <AuthProvider>
                    <LanguageProvider>
                        <NavigationProvider>
                            <div className="pb-20 md:pb-0">
                                {children}
                            </div>
                        </NavigationProvider>
                    </LanguageProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
