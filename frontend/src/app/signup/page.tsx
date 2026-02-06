'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface Exam {
    _id: string;
    name: string;
    fullName: string;
    category: string;
}

export default function SignupPage() {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        about: '',
        preferredExams: [] as string[],
        method: 'email' as 'email' | 'mobile'
    });
    const [examsList, setExamsList] = useState<Exam[]>([]);
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

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/exams');
            if (res.ok) setExamsList(await res.json());
        } catch (err) { console.error(err); }
    };

    const isPasswordValid = passwordCriteria.length && passwordCriteria.letter && passwordCriteria.match;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleExam = (examId: string) => {
        if (formData.preferredExams.includes(examId)) {
            setFormData({ ...formData, preferredExams: formData.preferredExams.filter(id => id !== examId) });
        } else {
            if (formData.preferredExams.length >= 5) return alert('Maximum 5 exams allowed');
            setFormData({ ...formData, preferredExams: [...formData.preferredExams, examId] });
        }
    };

    const handleSendOtp = async () => {
        if (!isPasswordValid) return alert(t('auth.fix_pass'));
        if (formData.preferredExams.length === 0) return alert(t('auth.select_exam_err'));

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
                    preferredExams: formData.preferredExams,
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
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-gray-100">
                <div className="text-center mb-10">
                    <img src="/logo_full.png" alt="SarkariMinds" className="h-16 mx-auto mb-4 object-contain" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">{t('auth.joining')}</p>
                </div>

                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-black text-gray-800 border-b-4 border-yellow-400 inline-block mb-2">{t('auth.step1')}</h2>
                        <div className="space-y-3">
                            <input name="name" value={formData.name} placeholder={t('auth.fullname')} className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:border-[#1a237e] rounded-2xl outline-none transition font-bold" onChange={handleInputChange} />
                            <input name="email" type="email" value={formData.email} placeholder={t('auth.email_hint')} className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:border-[#1a237e] rounded-2xl outline-none transition font-bold" onChange={handleInputChange} />
                            <input name="mobile" value={formData.mobile} placeholder={t('auth.mobile_hint')} className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:border-[#1a237e] rounded-2xl outline-none transition font-bold" onChange={handleInputChange} />
                            <textarea name="about" value={formData.about} placeholder={t('auth.bio_hint')} className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:border-[#1a237e] rounded-2xl outline-none transition font-bold resize-none h-24" onChange={handleInputChange} />

                            <div className="bg-blue-50/50 p-5 rounded-[2rem] border border-blue-100 space-y-3">
                                <input name="password" type="password" value={formData.password} placeholder={t('auth.pass_hint')} className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#1a237e] rounded-xl outline-none transition font-bold" onChange={handleInputChange} />
                                <input name="confirmPassword" type="password" value={formData.confirmPassword} placeholder={t('auth.confirm_pass')} className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#1a237e] rounded-xl outline-none transition font-bold" onChange={handleInputChange} />

                                <div className="mt-2 flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-widest">
                                    <span className={passwordCriteria.length ? 'text-green-600' : 'text-gray-400'}>
                                        {passwordCriteria.length ? '✓' : '○'} {t('auth.len6')}
                                    </span>
                                    <span className={passwordCriteria.letter ? 'text-green-600' : 'text-gray-400'}>
                                        {passwordCriteria.letter ? '✓' : '○'} {t('auth.letter')}
                                    </span>
                                    <span className={passwordCriteria.match ? 'text-green-600' : 'text-gray-400'}>
                                        {passwordCriteria.match ? '✓' : '○'} {t('auth.matching')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!formData.name || !formData.email || !formData.mobile || !isPasswordValid}
                            className="w-full bg-[#1a237e] hover:bg-black text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/10 disabled:opacity-30 uppercase tracking-widest mt-4"
                        >
                            {t('auth.confirm_next')}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5">
                        <h2 className="text-xl font-black text-gray-800 border-b-4 border-yellow-400 inline-block mb-2">{t('auth.step2')}</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('auth.route_select')}</p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setFormData({ ...formData, method: 'email' })}
                                className={`flex-1 p-5 border-2 rounded-2xl transition-all ${formData.method === 'email' ? 'border-[#1a237e] bg-blue-50 shadow-lg' : 'border-gray-100 hover:border-blue-200'}`}
                            >
                                <div className="text-3xl mb-1">📧</div>
                                <div className="text-[10px] font-black uppercase tracking-widest">{t('auth.email_verified')}</div>
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, method: 'mobile' })}
                                className={`flex-1 p-5 border-2 rounded-2xl transition-all ${formData.method === 'mobile' ? 'border-[#1a237e] bg-blue-50 shadow-lg' : 'border-gray-100 hover:border-blue-200'}`}
                            >
                                <div className="text-3xl mb-1">📱</div>
                                <div className="text-[10px] font-black uppercase tracking-widest">{t('auth.mobile_otp')}</div>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('settings.label.exams')} (Select 1-5)</p>
                            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto no-scrollbar py-2 p-1 border-y border-gray-50">
                                {examsList.map(exam => (
                                    <button
                                        key={exam._id}
                                        onClick={() => toggleExam(exam._id)}
                                        className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${formData.preferredExams.includes(exam._id) ? 'bg-[#1a237e] border-[#1a237e] text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        {exam.name}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold italic">You can change this anytime later from your profile</p>
                        </div>

                        <button onClick={handleSendOtp} disabled={loading} className="w-full bg-[#1a237e] hover:bg-black text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl uppercase tracking-widest mt-4">
                            {loading ? t('auth.processing') : `${t('auth.get_code')} ${formData.method.toUpperCase()}`}
                        </button>
                        <button onClick={() => setStep(1)} className="w-full text-gray-400 py-2 font-black text-[10px] uppercase tracking-widest hover:text-black">{t('auth.return_details')}</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-gray-900 border-b-4 border-yellow-400 inline-block">{t('auth.step3')}</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6">
                                {t('auth.enter_code_sent')} <span className="text-[#1a237e] underline">{formData.method === 'email' ? formData.email : formData.mobile}</span>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <input
                                placeholder={t('auth.otp_placeholder')}
                                className="w-full px-4 py-6 bg-gray-50 border-b-4 border-[#1a237e] rounded-2xl text-center tracking-[0.5em] text-4xl font-black focus:bg-white outline-none transition-all shadow-inner"
                                maxLength={formData.method === 'email' ? 6 : 4}
                                onChange={(e) => setOtpData({ ...otpData, otp: e.target.value })}
                            />

                            <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-3xl space-y-3 border-t-4 border-yellow-400">
                                <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                                    <span>🔒</span> {t('auth.sys_feedback')}
                                </p>
                                <p className="text-[11px] font-bold leading-relaxed opacity-90">
                                    {t('auth.otp_terminal_hint')}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleVerifyAndRegister}
                            disabled={loading || !otpData.otp}
                            className="w-full bg-[#1a237e] hover:bg-black text-white py-5 rounded-2xl font-black text-xl transition-all shadow-xl disabled:opacity-20 uppercase tracking-widest"
                        >
                            {loading ? t('auth.authenticating') : t('auth.launch_portal')}
                        </button>
                        <button onClick={() => setStep(2)} className="w-full text-gray-400 py-2 font-black text-[10px] uppercase tracking-widest hover:text-black">{t('auth.reset_method')}</button>
                    </div>
                )}

                <div className="mt-12 pt-10 border-t border-gray-50 text-center">
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
                        {t('auth.inner_circle')} <Link href="/login" className="text-[#1a237e] hover:underline transition ml-1 font-black">{t('auth.secure_login')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

