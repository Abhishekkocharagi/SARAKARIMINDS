'use client';

import React from 'react';

interface User {
    _id: string;
    name: string;
    profilePic: string;
    accountType?: string;
}

interface MentionDropdownProps {
    users: User[];
    onSelect: (user: User) => void;
    selectedIndex: number;
}

export default function MentionDropdown({ users, onSelect, selectedIndex }: MentionDropdownProps) {
    if (users.length === 0) return null;

    return (
        <div className="absolute z-[100] bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden min-w-[200px] max-w-[300px]">
            <div className="p-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Mention Users</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
                {users.map((user, index) => (
                    <button
                        key={user._id}
                        onClick={() => onSelect(user)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all ${index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50 border-l-4 border-transparent'
                            }`}
                    >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 overflow-hidden shadow-sm">
                            {user.profilePic ? (
                                <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-800 text-white font-bold text-xs uppercase">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className={`text-sm font-bold truncate ${index === selectedIndex ? 'text-blue-700' : 'text-gray-800'}`}>
                                {user.name}
                            </p>
                            {user.accountType && (
                                <p className="text-[10px] text-gray-400 font-medium tracking-tighter uppercase truncate">
                                    {user.accountType}
                                </p>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
