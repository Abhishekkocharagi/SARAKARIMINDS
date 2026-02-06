'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/translations';

const EXAMS: TranslationKey[] = [
    'exam.kas', 'exam.fda', 'exam.sda',
    'exam.pdo', 'exam.psi', 'exam.pc',
    'exam.aeje', 'exam.hescom', 'exam.tet',
    'exam.va', 'exam.pwd', 'exam.group_abc'
];

export default function Register() {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        about: '',
        exams: [] as string[],
        method: 'email' as 'email' | 'mobile'
    });
    const [otpData, setOtpData] = useState({ otp: '' });
    const [loading, setLoading] = useState(false);
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        letter: false,
        match: false,
    });
    const router = useRouter();

    useEffect(() => {
        setPasswordCriteria({
            length: formData.password.length >= 6,
            letter: /[a-zA-Z]/.test(formData.password),
            match: formData.password !== '' && formData.password === formData.confirmPassword,
        });
    }, [formData.password, formData.confirmPassword]);

    const isPasswordValid = passwordCriteria.length && passwordCriteria.letter && passwordCriteria.match;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleExam = (exam: string) => {
        if (formData.exams.includes(exam)) {
            setFormData({ ...formData, exams: formData.exams.filter(e => e !== exam) });
        } else {
            setFormData({ ...formData, exams: [...formData.exams, exam] });
        }
    };

    const handleSendOtp = async () => {
        if (!isPasswordValid) return alert(t('auth.fix_pass'));
        if (formData.exams.length === 0) return alert(t('auth.select_exam_err'));

        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    mobile: formData.mobile,
                    method: formData.method
                })
            });
            if (res.ok) {
                setStep(3);
            } else {
                const data = await res.json();
                alert(data.message);
            }
        } catch (err) { alert(t('auth.otp_fail')); }
        finally { setLoading(false); }
    };

    const handleVerifyAndRegister = async () => {
        if (!otpData.otp) return alert(t('auth.enter_otp_err'));

        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/verify-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    mobile: formData.mobile,
                    password: formData.password,
                    about: formData.about,
                    exams: formData.exams,
                    otp: otpData.otp
                })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data));
                window.location.href = '/feed';
            } else { alert(data.message); }
        } catch (err) { alert(t('auth.reg_fail')); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF] flex flex-col items-center justify-center p-6 text-gray-900 font-sans">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-blue-900 tracking-tighter italic">NammaSarkaari</h1>
                    <p className="text-gray-500 mt-1 font-bold text-sm uppercase tracking-widest">{t('hero.subtitle')}</p>
                </div>

                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-black text-gray-800 border-b-4 border-yellow-400 inline-block mb-2">{t('auth.step1')}</h2>
                        <div className="space-y-3">
                            <input name="name" value={formData.name} placeholder={t('auth.fullname')} className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-xl outline-none transition font-bold" onChange={handleInputChange} />
                            <input name="email" type="email" value={formData.email} placeholder={t('auth.email_label')} className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-xl outline-none transition font-bold" onChange={handleInputChange} />
                            <input name="mobile" value={formData.mobile} placeholder={t('auth.mobile_hint')} className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-xl outline-none transition font-bold" onChange={handleInputChange} />
                            <textarea name="about" value={formData.about} placeholder={t('auth.bio_hint')} className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-xl outline-none transition font-bold resize-none h-24" onChange={handleInputChange} />

                            <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100 space-y-3">
                                <input name="password" type="password" value={formData.password} placeholder={t('auth.pass_hint')} className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-blue-600 rounded-xl outline-none transition font-bold" onChange={handleInputChange} />
                                <input name="confirmPassword" type="password" value={formData.confirmPassword} placeholder={t('auth.confirm_pass')} className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-blue-600 rounded-xl outline-none transition font-bold" onChange={handleInputChange} />

                                <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-tighter">
                                    <span className={passwordCriteria.length ? 'text-green-600' : 'text-blue-300'}>
                                        {passwordCriteria.length ? '✓' : '●'} {t('auth.len6')}
                                    </span>
                                    <span className={passwordCriteria.letter ? 'text-green-600' : 'text-blue-300'}>
                                        {passwordCriteria.letter ? '✓' : '●'} {t('auth.letter')}
                                    </span>
                                    <span className={passwordCriteria.match ? 'text-green-600' : 'text-blue-300'}>
                                        {passwordCriteria.match ? '✓' : '●'} {t('auth.matching')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!formData.name || !formData.email || !formData.mobile || !isPasswordValid}
                            className="w-full bg-blue-700 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all transform active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-xl"
                        >
                            {t('auth.register.next_step')}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5">
                        <h2 className="text-xl font-black text-gray-800 border-b-4 border-yellow-400 inline-block mb-2">{t('auth.step2')}</h2>
                        <p className="text-sm font-bold text-gray-500">{t('auth.register.how_to_verify')}</p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setFormData({ ...formData, method: 'email' })}
                                className={`flex-1 p-4 border-4 rounded-2xl transition-all ${formData.method === 'email' ? 'border-blue-700 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                            >
                                <div className="text-2xl mb-1">📧</div>
                                <div className="text-xs font-black uppercase tracking-widest">{t('auth.email_verified').split(' ')[0]}</div>
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, method: 'mobile' })}
                                className={`flex-1 p-4 border-4 rounded-2xl transition-all ${formData.method === 'mobile' ? 'border-blue-700 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                            >
                                <div className="text-2xl mb-1">📱</div>
                                <div className="text-xs font-black uppercase tracking-widest">{t('auth.mobile_otp').split(' ')[0]}</div>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-bold text-gray-500">{t('auth.register.pick_exams')}</p>
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar py-2 p-1">
                                {EXAMS.map(examKey => (
                                    <button
                                        key={examKey}
                                        onClick={() => toggleExam(examKey)}
                                        className={`px-3 py-2 rounded-xl border-2 text-[10px] font-black uppercase transition ${formData.exams.includes(examKey) ? 'bg-blue-700 border-blue-700 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-blue-300'}`}
                                    >
                                        {t(examKey)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleSendOtp} disabled={loading} className="w-full bg-blue-700 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl">
                            {loading ? t('auth.register.sending_code') : `${t('auth.get_code')} ${formData.method.toUpperCase()}`}
                        </button>
                        <button onClick={() => setStep(1)} className="w-full text-gray-400 py-2 font-black text-xs uppercase underline">{t('auth.return_details')}</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-gray-900 border-b-4 border-yellow-400 inline-block">{t('auth.step3')}</h2>
                            <p className="text-sm font-bold text-gray-500 mt-4 leading-relaxed">
                                {t('auth.enter_code_sent')} <span className="text-blue-700 font-black underline">{formData.method === 'email' ? formData.email : formData.mobile}</span>.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <input
                                placeholder={t('auth.otp_placeholder')}
                                className="w-full px-4 py-6 bg-gray-50 border-4 border-transparent focus:border-blue-700 rounded-3xl text-center tracking-[0.5em] text-4xl font-black focus:bg-white outline-none transition shadow-inner"
                                maxLength={formData.method === 'email' ? 6 : 4}
                                onChange={(e) => setOtpData({ ...otpData, otp: e.target.value })}
                            />

                            <div className="bg-black text-white p-5 rounded-3xl shadow-2xl space-y-2">
                                <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                                    <span>⚠️</span> {t('auth.register.security_console')}
                                </p>
                                <p className="text-[11px] font-medium leading-relaxed opacity-80">
                                    {t('auth.otp_terminal_hint')}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleVerifyAndRegister}
                            disabled={loading || !otpData.otp}
                            className="w-full bg-blue-700 text-white py-5 rounded-3xl font-black text-xl hover:bg-green-600 transition-all shadow-2xl active:scale-95 disabled:opacity-20"
                        >
                            {loading ? t('auth.authenticating') : t('auth.register.finalize_signup')}
                        </button>
                        <button onClick={() => setStep(2)} className="w-full text-gray-400 py-2 font-black text-xs uppercase underline">{t('auth.register.change_selection')}</button>
                    </div>
                )}

                <div className="mt-10 text-center text-xs font-bold text-gray-400 tracking-tighter uppercase px-4 leading-relaxed">
                    {t('auth.inner_circle')} <Link href="/login" className="text-blue-700 hover:text-black transition underline ml-1">{t('auth.secure_login')}</Link>
                </div>
            </div>
        </div>
    );
}

